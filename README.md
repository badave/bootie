### About Bootie

TBD


### Components

The components of Bootie are as follows:

- Controller
- Crud Controller
- Model
- Collection
- Router
- Adapter
- Mongo
- Database

#### Controllers

Why is there a `base` and `base_crud` controller?

The intention is to keep `Bootie.Controller` and `Bootie.CrudController` as implementation agnostic as possible.

Therefore in order to configure the loading of application specific `middleware`, a base controller and/or a base crud controller is recommended as an extra layer of inheritance.


#### Models

Why is there a `base` model and collection?

Similar principle to controllers, except in the case of models, it is commonly used to define things like `privateAttributes` or other properties that are intended to be inherited by most if not all of the application's models.

A good example is ... TBD

There is less of a reason for base collection, but it is done here to show what is possible.


### What features does Bootie have?

TBD

### What does Bootie not do?

- Does not give you wings.

### Why should I use Bootie?

Bootie is not for everyone. It worked really well for our team and what we wanted to accomplish so we just wanted to share it with anyone would could benefit from our learnings.

### Why did you build Bootie?

While developing [Celery's](https://trycelery.com) new API, we first started out as using a pure express.js implementation.

### Unit Test Coverage

- Model
- Collection
- Mongo

### TODO

- More unit test coverage