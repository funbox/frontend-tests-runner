# Changelog

## 4.1.0 (16.12.2022)

Now `filterTestsFiles` callback accepts tests config as a third param.


## 4.0.1 (14.02.2022)

Updated Mocha to v9.2 to fix [nanoid CVE](https://github.com/advisories/GHSA-qrpm-p2h7-hrv2).


## 4.0.0 (28.10.2021)

We've updated Mocha to v9 and dropped old config format support. 

Please, refer to [migration guide](./MIGRATION.md) for more information. 


## 3.1.2 (10.06.2021)

Fixed several security vulnerabilities:

- [Use of a Broken or Risky Cryptographic Algorithm](https://github.com/advisories/GHSA-r9p9-mrjm-926w) in [elliptic](https://github.com/indutny/elliptic). Updated from 6.5.3 to 6.5.4.

- [Regular Expression Denial of Service](https://github.com/advisories/GHSA-43f8-2h32-f4cj) in [hosted-git-info](https://github.com/npm/hosted-git-info). Updated from 2.8.8 to 2.8.9.

- [Command Injection](https://github.com/advisories/GHSA-35jh-r3h4-6jhm) in [lodash](https://github.com/lodash/lodash). Updated from 4.17.20 to 4.17.21.

- [Regular Expression Denial of Service](https://www.npmjs.com/advisories/1751) in [glob-parent](https://www.npmjs.com/package/glob-parent). Updated from 5.1.1 to 5.1.2.


## 3.1.1 (18.01.2021)

* Updated Mocha to 6.2.3 to fix npm audit warnings.

## 3.1.0 (15.12.2020)

* Added ability to filter tests files using `filterTestsFiles` option.


## 3.0.0 (26.10.2020)

* Updated the deps.
* Replaced `glob` dep with `fast-glob`.
* Added LICENSE.
* Prepared the package for publishing on GitHub.

## 2.3.0 (02.06.2020)

* Added support for multiple values for Mocha options.

## 2.2.1 (28.05.2020)

* Fixed empty line output.

## 2.2.0 (27.11.2019)

* Added param for log output directory name.

## 2.1.0 (18.09.2019)

* Updated deps.

## 2.0.1 (21.05.2019)

* Fix passed arguments check.

## 2.0.0 (21.05.2019)

* Added support for passing Mocha args from the config.

## 1.2.0 (08.05.2019)

* Fixed the package name in README.

## 1.1.0 (03.12.2018)

* Improved the package publishing settings.

## 1.0.0 (29.06.2018)

* Moved the package into the @funboxteam scope. 

## 0.2.1 (23.05.2018)

* Fixed start time format.

## 0.2.0 (26.04.2018)

* Added Windows support.

## 0.1.0 (28.12.2017)

* Initial version.
