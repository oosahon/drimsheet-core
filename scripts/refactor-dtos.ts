import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const dtoFiles = project.getSourceFiles('src/app/**/*.dto.ts');
const mapperFiles = project.getSourceFiles('src/app/**/*.mapper.ts');

const oldToNewPaths = new Map<
  string,
  {
    dto: string;
    validation: string;
    mapper: string;
  }
>();

// Maps an old module specifier (e.g. '../../dtos/money.dto') to the new ones
// Wait, we can just find all imports and update them.

async function run() {
  console.log(
    `Found ${dtoFiles.length} DTO files and ${mapperFiles.length} Mapper files.`
  );

  // Step 1: Create the new structure and move contents
  for (const dtoFile of dtoFiles) {
    const oldPath = dtoFile.getFilePath();
    const dir = path.dirname(oldPath);
    const baseName = path.basename(oldPath, '.dto.ts');
    const name = baseName;

    const newDir = path.join(dir, name);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }

    const newDtoPath = path.join(newDir, `${name}.dto.ts`);
    const newValidationPath = path.join(newDir, `${name}.dto.validation.ts`);
    const newMapperPath = path.join(newDir, `${name}.dto.mapper.ts`);

    oldToNewPaths.set(oldPath, {
      dto: newDtoPath,
      validation: newValidationPath,
      mapper: newMapperPath,
    });

    // We want to separate validation logic and interface logic.
    // Interface logic: TypeAliasDeclaration, InterfaceDeclaration, EnumDeclaration
    // Validation logic: VariableStatement (const schemas)
    // There are also imports.

    let dtoText = '';
    let validationText = "import z from 'zod';\n";

    const statements = dtoFile.getStatements();
    const exportedDtoSymbols: string[] = [];
    const exportedValidationSymbols: string[] = [];

    // We'll manually copy statements based on type
    for (const stmt of statements) {
      const text = stmt.getFullText();
      const kind = stmt.getKind();

      if (
        kind === SyntaxKind.InterfaceDeclaration ||
        kind === SyntaxKind.TypeAliasDeclaration ||
        kind === SyntaxKind.EnumDeclaration
      ) {
        dtoText += text;
        const nameNode = (stmt as any).getNameNode?.();
        if (nameNode && stmt.hasExportKeyword?.()) {
          exportedDtoSymbols.push(nameNode.getText());
        }
      } else if (kind === SyntaxKind.VariableStatement) {
        validationText += text;
        // Find exported variables
        const decList = (stmt as any).getDeclarationList?.();
        if (decList && stmt.hasExportKeyword?.()) {
          for (const dec of decList.getDeclarations()) {
            exportedValidationSymbols.push(dec.getName());
          }
        }
      } else if (kind === SyntaxKind.ImportDeclaration) {
        // Copy imports to both for now, we'll clean them up later or let eslint/ts-ignore do it
        // Or better, just keep imports. The paths might need adjusting if we move deeper.
        // Wait! We moved from `dtos/` to `dtos/<name>/`. This means relative imports need `../` prepended!
        const importDecl = stmt as any;
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        if (moduleSpecifier.startsWith('.')) {
          // Adjust relative import
          const isRelative = moduleSpecifier.startsWith('.');
          if (isRelative) {
            importDecl.setModuleSpecifier(`../${moduleSpecifier}`);
            dtoText += importDecl.getFullText();
            validationText += importDecl.getFullText();
            importDecl.setModuleSpecifier(moduleSpecifier); // revert for further processing
          }
        } else {
          dtoText += text;
          validationText += text;
        }
      } else {
        // Other statements (e.g. comments at the top, functions)
        dtoText += text;
      }
    }

    // Create the files using ts-morph so we can manipulate them
    const newDtoFile = project.createSourceFile(newDtoPath, dtoText, {
      overwrite: true,
    });
    const newValidationFile = project.createSourceFile(
      newValidationPath,
      validationText,
      { overwrite: true }
    );

    // Now add import to validation file so it can use the interfaces
    if (exportedDtoSymbols.length > 0) {
      newValidationFile.addImportDeclaration({
        moduleSpecifier: `./${name}.dto`,
        namedImports: exportedDtoSymbols,
      });
    }

    // The mapper logic
    const namespaceDir = path.dirname(dir); // src/app/<namespace>
    const expectedOldMapperPath = path.join(
      namespaceDir,
      'mappers',
      `${name}.mapper.ts`
    );
    const oldMapperFile = project.getSourceFile(expectedOldMapperPath);

    if (oldMapperFile) {
      let mapperText = oldMapperFile.getFullText();
      const newMapperFile = project.createSourceFile(
        newMapperPath,
        mapperText,
        { overwrite: true }
      );

      // Update its relative imports. It moved from `src/app/<ns>/mappers/` to `src/app/<ns>/dtos/<name>/`
      // For any relative import, we need to resolve it against the old path and then relative to the new path
      for (const imp of newMapperFile.getImportDeclarations()) {
        const mod = imp.getModuleSpecifierValue();
        if (mod.startsWith('.')) {
          const absPath = path.resolve(
            path.dirname(oldMapperFile.getFilePath()),
            mod
          );
          let newRel = path.relative(path.dirname(newMapperPath), absPath);
          if (!newRel.startsWith('.')) newRel = './' + newRel;
          // Strip extension if present? ts imports don't have .ts
          imp.setModuleSpecifier(newRel);
        }
      }

      // Also we need an empty mapper if it doesn't exist? The user said "collocate mappers to dtos".
      // If it doesn't exist, we probably don't need to create an empty one unless requested. Let's just move existing ones.
    }
  }

  // Step 2: Global Import Rewrite
  // For every file in the project, check its imports.
  for (const sourceFile of project.getSourceFiles()) {
    for (const imp of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      if (!moduleSpecifier.startsWith('.')) continue; // skip non-relative

      const absImportPath = path.resolve(
        path.dirname(sourceFile.getFilePath()),
        moduleSpecifier
      );

      // Check if this imports one of our old DTOs
      for (const [oldPath, newPaths] of oldToNewPaths.entries()) {
        // oldPath is something like /path/to/src/app/shared/dtos/money.dto.ts
        // absImportPath would be /path/to/src/app/shared/dtos/money.dto
        const oldPathNoExt = oldPath.replace(/\.ts$/, '');
        if (absImportPath === oldPathNoExt) {
          // This file imports from the old DTO.
          // We need to split the import into .dto and .validation if necessary.
          const namedImports = imp
            .getNamedImports()
            .map((ni: any) => ni.getName());

          let usesDto = false;
          let usesValidation = false;

          const dtoExports =
            project.getSourceFile(newPaths.dto)?.getExportedDeclarations() ||
            new Map();
          const validationExports =
            project
              .getSourceFile(newPaths.validation)
              ?.getExportedDeclarations() || new Map();

          const dtoImports: string[] = [];
          const validationImports: string[] = [];

          for (const name of namedImports) {
            if (dtoExports.has(name)) {
              usesDto = true;
              dtoImports.push(name);
            } else if (validationExports.has(name)) {
              usesValidation = true;
              validationImports.push(name);
            } else {
              // Not found? Default to dto
              usesDto = true;
              dtoImports.push(name);
            }
          }

          const name = path.basename(oldPath, '.dto.ts');
          const newDtoRelPath = path
            .relative(path.dirname(sourceFile.getFilePath()), newPaths.dto)
            .replace(/\.ts$/, '');
          const newValidationRelPath = path
            .relative(
              path.dirname(sourceFile.getFilePath()),
              newPaths.validation
            )
            .replace(/\.ts$/, '');

          const fixRel = (p: string) => (p.startsWith('.') ? p : './' + p);

          // Remove old import
          const insertIndex = imp.getChildIndex();
          imp.remove();

          let insertOffset = 0;
          if (usesDto) {
            sourceFile.insertImportDeclaration(insertIndex + insertOffset, {
              moduleSpecifier: fixRel(newDtoRelPath),
              namedImports: dtoImports,
            });
            insertOffset++;
          }
          if (usesValidation) {
            sourceFile.insertImportDeclaration(insertIndex + insertOffset, {
              moduleSpecifier: fixRel(newValidationRelPath),
              namedImports: validationImports,
            });
          }
        }

        // Also check if it imports the old mapper
        const namespaceDir = path.dirname(path.dirname(oldPath));
        const name = path.basename(oldPath, '.dto.ts');
        const oldMapperPathNoExt = path.join(
          namespaceDir,
          'mappers',
          `${name}.mapper`
        );

        if (absImportPath === oldMapperPathNoExt) {
          const newMapperRelPath = path
            .relative(path.dirname(sourceFile.getFilePath()), newPaths.mapper)
            .replace(/\.ts$/, '');
          const fixRel = (p: string) => (p.startsWith('.') ? p : './' + p);
          imp.setModuleSpecifier(fixRel(newMapperRelPath));
        }
      }
    }
  }

  // Step 3: Remove old files
  for (const [oldPath, newPaths] of oldToNewPaths.entries()) {
    const f = project.getSourceFile(oldPath);
    if (f) f.delete();

    const namespaceDir = path.dirname(path.dirname(oldPath));
    const name = path.basename(oldPath, '.dto.ts');
    const expectedOldMapperPath = path.join(
      namespaceDir,
      'mappers',
      `${name}.mapper.ts`
    );
    const oldMapperFile = project.getSourceFile(expectedOldMapperPath);
    if (oldMapperFile) oldMapperFile.delete();
  }

  await project.save();
  console.log('Done refactoring.');
}

run().catch(console.error);
