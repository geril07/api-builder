Always install packages with `--save-exact` to pin the exact version in `package.json`. Never use caret (`^`) or tilde (`~`) ranges for new dependencies.

```sh
npm install <package> --save-exact
npm install -D <package> --save-exact
```
