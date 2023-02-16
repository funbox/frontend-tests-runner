# Migration

## 3.1.2 → 4.0.0

There are two breaking changes: 

1. We've dropped the support of old config format.
2. We've updated Mocha to v9.


### Config

The deprecated config format was removed. 
If you passed `timeout`, `retries` & `noColors` not inside the `mocha` field, then you should rewrite your config.

Convert this:

```js
{
  timeout: 30000,
  retries: 0,
  noColors: false,
  // ...
}
```

To this:

```js
{
  // ...
  mocha: {
    timeout: 30000,
    retries: 0,
    noColors: false,
    // ...
  },
}
```

If you already pass those options inside the `mocha` field, then you're fine.


### Mocha

Mocha was updated to v9.1.3. Below you can find links to the breaking changes of Mocha:

- [v6 to v7](https://github.com/mochajs/mocha/blob/master/CHANGELOG.md#700--2020-01-05)
- [v7 to v8](https://github.com/mochajs/mocha/blob/master/CHANGELOG.md#800--2020-06-10)
- [v8 to v9](https://github.com/mochajs/mocha/blob/master/CHANGELOG.md#900--2021-06-07)

But if you only used frontend-tests-runner “as is” without tweaking Mocha or the internals of this package,
most probably you can update without any problems.
