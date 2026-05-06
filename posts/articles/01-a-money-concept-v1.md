# Article 01-A — Money Is Not a Number (Outline v1)

## Status

- [ ] Title finalised
- [ ] Outline approved
- [ ] Draft written
- [ ] Review done

---

# Goal

On a popular Nigerian Fintech application, my account balance once read

```tsx
NGN 100,000.999
```

One Hundred Thousand, Nine Hundred and Ninety-Nine Kobo. Of course, that’s not a valid amount. However, if you remove the currency, it’s still a valid number, which is precisely the problem.

I’ve observed many similar atrocities both as an end-user and a software engineer working with money in financial applications. The UX, accounting, and sometimes legal issues that arise from wrong money formatting or computation can be traced back to a single root: how money is perceived.

By the end of this article, you’ll understand why:

- Money is not a number.
- Mainstream programming languages do not try to make it a primitive.
- It’s your responsibility as the developer to model it correctly.

Also, you’ll learn how to model money effectively so that you can perform arithmetic and format it easily and deterministically.

## Money ≠ Number

`GBP 100`, `JPY 100`, and `KWD 100` are all `100` on paper, if you look at them as pure numbers. As money, they couldn’t be more different. Additionally, they can be represented in different ways:

- `GBP 100` ⇒ `£ 100.00` : One hundred British Pounds, zero cents
- `JPY 100` ⇒ `¥ 100` : One hundred Japanese Yen, no fraction
- `KWD 100` ⇒ `100.000د.ك` : One hundred Kuwaiti Dinars, three decimal places.

This is one reason why it would be hard to model as a primitive in programming languages, and why the modelling responsibility falls on you, the developer.

## Modelling Money

In our previous example, we could say the difference between `GBP 100`, `JPY 100`, and `KWD 100` are their respective currencies. If you take away the individual currencies from the money, it’s just `100`. So, to adequately model money in a financial application is to adequately model currencies.

Luckily for us, every major currency has the following properties: code, symbol, name, and minor units. Therefore, we can model a currency like so:

```tsx
interface ICurrency {
  code: string;
  symbol: string;
  name: string;
  minorUnit: number;
}

// NGN
const Naira: ICurrency = {
  code: 'NGN',
  symbol: '₦',
  name: 'Nigerian Naira',
  minorUnit: 2,
};

// JPY
const Yen: ICurrency = {
  code: 'JPY',
  symbol: '¥',
  name: 'Japanese Yen',
  minorUnit: 0,
};

// ...
```

With this, we can now model our money like so:

```tsx
interface IMoney {
  amount: bigint;
  isMinorUnit: boolean;
  currency: ICurrency;
}
```

- `amount`: this is the value of the money, and we used bigint here to reduce float errors (more on this when we look at how to perform arithmetic on money).
- `isMinorUnit`: explicitly set as a boolean. This is important because you will receive values from different interfaces, and those producers have to specify whether or not the money needs normalisation.
- `currency`: the currency model we just looked at.

By modelling our money like this, we have set ourselves up for success in many ways. Now, we can build on top of this to add arithmetic and exchange rate logic.

In the next article, we will discuss how to perform arithmetic on money.
