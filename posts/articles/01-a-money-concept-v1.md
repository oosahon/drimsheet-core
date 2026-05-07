# Article 01-A — Money Is Not a Number (Outline v1)

## Status

- [ ] Title finalised
- [ ] Outline approved
- [ ] Draft written
- [ ] Review done

---

# Introduction

On a popular Nigerian Fintech application, my account balance once read

```tsx
NGN 100,000.999
```

One Hundred Thousand and Nine Hundred and Ninety Nine Kobo. Of course, that’s not a valid amount. However, if you remove the currency, it’s still a valid number, which is precisely the problem, or at least, one of the problems.

I’ve observed many similar atrocities both as an end-user and a software engineer working with money in financial applications. The UX, accounting and sometimes legal issues that arise from wrong money formatting or computation can be traced back to a single root: how money is perceived.

Apart from how money is perceived, there’s an array of issues when performing arithmetic on money.

By the end of this article, you’ll understand why:

- Money is not a number.
- Mainstream programming languages do not make it a primitive.
- It’s your responsibility as the developer to model it correctly.

Also, you’ll learn how to model money efficiently and perform arithmetic on it safely.

## Money ≠ Number

`GBP 100`, `JPY 100`, and `KWD 100` are all `100` on paper, if you looked at them as pure numbers. As money, they couldn’t be more different. Additionally, they can be represented in different ways:

- `GBP 100` ⇒ `£ 100.00` : One hundred British Pounds, zero cents
- `JPY 100` ⇒ `¥ 100` : One hundred Japanese Yen, no fraction.
- `KWD 100` ⇒ `100.000د.ك` : One hundred Kuwaiti Dinars, three decimal places.

This is one reason why it would be hard to model as a primitive in programming languages, and why the modelling responsibility is passed on to you, the developer.

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

With this, we can now model our money thus:

```tsx
interface IMoney {
  amount: bigint;
  currency: ICurrency;
}
```

- `amount`: this is the value of the money, and we used bigint here to reduce float errors (more on this when we look at how to perform arithmetic on money).
- `currency`: the currency model we just looked at.

> [!IMPORTANT]
> Notice we only store `amount` and `currency`. When creating this object, our factory function will accept a parameter (e.g., isMinorUnit: boolean) to know if the incoming amount needs normalization first. Once created, the IMoney object guarantees the amount is strictly in the minor unit.
> `
> By modelling our money like this, we have set ourselves up for success in many ways. Now, we can build on top of this to add arithmetic and exchange rate logic.

## Basic Rules

Before we implement the code, we have set a couple of guardrails for ourselves, teams or coding agents. Here are some important rules we must adhere to:

#### Rule 1: The creation of money objects must be done in a single factory

```tsx
// Bad
const money = {
  amount: payload.amount,
  currency: payload.currency,
};

// Good
const money = moneyValue.make(payload);
```

#### Rule 2: The computation of money must be done by utility methods

```tsx
// Bad
const difference = {
  amount: money1.amount - money2.amount,
  currency: money1.currency,
};

// Good
const difference = moneyValue.subtract(money1, money2);
```

#### Rule 3: Money must always be represented in the minor unit

```tsx
GBP 100  = GBP 10_000
JPY 100  = JPY 100
KWD 100  = KWD 100_000
```

By doing these, we ensure that there’s harmony in the way we create and compute money. If there are bugs or we need to make improvements, we can handle them at the source.

In the next article, we are going to translate this model and these rules into code, and safely represent money and perform arithmetic on it.
