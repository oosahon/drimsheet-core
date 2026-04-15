const fs = require('fs');
const content = fs.readFileSync(
  'src/app/usecases/auth/__specs__/send-email-verification-email.usecase.spec.ts',
  'utf-8'
);
console.log(
  content.substring(
    content.indexOf("it('should generate verification link"),
    content.length
  )
);
