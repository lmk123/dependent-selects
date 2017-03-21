# Dependent Selects

Help you to create dependent selects boxes such as regions (for example, country -> district -> street).

## Features

 - Asynchronous, based on [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
 - 1.2KB only (min+gzip)
 - No UI, so you can (and have to) customize UI by yourself

## Usage & Examples

There is an fully example: https://jsfiddle.net/lmk123/8d2x8dLy/

Another example with [Vue.js](https://vuejs.org/): https://jsfiddle.net/lmk123/40k949en/

## Install

```
npm install dependent-selects --save
```

In Webpack:

```js
import DependentSelects from 'dependent-selects'

const multi = new DependentSelects(queryFunction)
// ...
```

In browser:

```html
<script src="node_modules/dependent-selects/dist/dependent-selects.js"></script>
<script>
  var multi = new DependentSelects(queryFunction)
  // ...
</script>
```

## API

Please see the above examples.

## License

MIT
