import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const logger = createLogger('TodoAccess')

export class TodoAccess {
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todoTable = process.env.TODOS_TABLE,
    ) { }

    async createTodo(item: TodoItem)
        : Promise<TodoItem> {
        logger.info(`create todo ${item.todoId} for user ${item.userId}`)

        await this.docClient.put({
            TableName: this.todoTable,
            Item: item
        }).promise()

        return item
    }

    async getTodosForUser(userId: string)
        : Promise<TodoItem[]> {
        logger.info(`get todos for user ${userId}`)

        const result = await this.docClient.query({
            TableName: this.todoTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            }
        }).promise()

        return result.Items as TodoItem[]
    }

    async updateTodoForUser(userId: string, todoId: string, data: TodoUpdate)
        : Promise<TodoItem> {
        logger.info(`update todo ${todoId} for user ${userId}`)

        const result = await this.docClient.update({
            TableName: this.todoTable,
            Key: {
                todoId: todoId,
                userId: userId,
            },
            UpdateExpression: "SET #N=:name, #DD=:dueDate, #D=:done",
            ExpressionAttributeNames: {
                "#N": "name",
                "#DD": "dueDate",
                "#D": "done",
            },
            ExpressionAttributeValues: {
                ":name": data.name,
                ":dueDate": data.dueDate,
                ":done": data.done,
            },
            ReturnValues: "ALL_NEW",
        }).promise()

        const item = result.Attributes
        return item as TodoItem
    }

    async setAttachmentUrl(userId: string, todoId: string, url: string)
        : Promise<TodoItem> {
        logger.info(`set URL for todo ${todoId} for user ${userId}`)

        const result = await this.docClient.update({
            TableName: this.todoTable,
            Key: {
                todoId: todoId,
                userId: userId,
            },
            UpdateExpression: "SET #URL=:url",
            ExpressionAttributeNames: {
                "#URL": "attachmentUrl",
            },
            ExpressionAttributeValues: {
                ":url": url,
            },
            ReturnValues: "ALL_NEW",
        }).promise()

        const item = result.Attributes
        return item as TodoItem
    }

    async deleteTodoForUser(userId: string, todoId: string)
        : Promise<TodoItem> {
        const result = await this.docClient.delete({
            TableName: this.todoTable,
            Key: {
                todoId: todoId,
                userId: userId,
            }
        }).promise()
        return result.Attributes as TodoItem
    }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        return new AWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new AWS.DynamoDB.DocumentClient()
}
