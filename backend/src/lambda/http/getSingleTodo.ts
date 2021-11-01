import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { getSingleTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils';

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const todo = await getSingleTodo(getUserId(event), todoId)
    return {
      statusCode: 200,
      body: JSON.stringify({
        item: todo
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(cors({
    credentials: true
  }))
