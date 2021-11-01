import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { updatePublicTodo } from '../../businessLogic/todos'
import { UpdatePublicTodoRequest } from '../../requests/UpdatePublicTodoRequest'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const updatedTodo: UpdatePublicTodoRequest = JSON.parse(event.body)

    const updatedTodoItem = await updatePublicTodo(getUserId(event), todoId, updatedTodo)

    return {
      statusCode: 200,
      body: JSON.stringify({
        item: updatedTodoItem
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(cors({
    credentials: true
  }))
