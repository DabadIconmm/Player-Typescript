
## sync throw

No se puede llamar a la funcion directamente si tiene parametros porque eso probaria el valor de respuesta:

```JavaScript
assert.throws(()=>foo(abc)); //Valido
assert.throws(foo); //Valido

assert.throws(foo(abc)); // Invalido a no ser que foo(abc) devuelva una funcion.
```

## [async throw](https://github.com/lukeed/uvu/issues/35#issuecomment-896270152)

```JavaScript
try {
  await asyncFnThatThrows();
  assert.unreachable('should have thrown');
} catch (err) {
  assert.instance(err, Error);
  assert.match(err.message, 'something specific');
  assert.is(err.code, 'ERROR123');
}
```
