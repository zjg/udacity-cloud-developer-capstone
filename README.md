TODO application with additional features
===

This application is an extension of the course 4 Serverless TODO app,
with additional features:

    - edit page allows TODO name, due date, done, and public state to be modified
    - main page shows TODO items from other users that are marked as 'public',
      and allows their done state to be modified

In order to support the public TODO items, an additional index is needed on the
DynamoDB, along with a few additional API endpoints in the backend.

The main page's React state management was also updated to unify the owned and
non-owned TODO items.

See screenshots in ./screenshots folder.

API backend is available at:

    GET - https://flgjei7q7k.execute-api.us-west-1.amazonaws.com/dev/todos
    GET - https://flgjei7q7k.execute-api.us-west-1.amazonaws.com/dev/publicTodos
    GET - https://flgjei7q7k.execute-api.us-west-1.amazonaws.com/dev/todos/{todoId}
    POST - https://flgjei7q7k.execute-api.us-west-1.amazonaws.com/dev/todos
    PATCH - https://flgjei7q7k.execute-api.us-west-1.amazonaws.com/dev/todos/{todoId}
    PATCH - https://flgjei7q7k.execute-api.us-west-1.amazonaws.com/dev/publicTodos/{todoId}
    DELETE - https://flgjei7q7k.execute-api.us-west-1.amazonaws.com/dev/todos/{todoId}
    POST - https://flgjei7q7k.execute-api.us-west-1.amazonaws.com/dev/todos/{todoId}/attachment