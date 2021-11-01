import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const logger = createLogger('TodoAccess')

// generate item with 'public' attribute as a sparse index
// see: https://stackoverflow.com/a/28284261
type TodoItem_without_public = {
    [K in keyof TodoItem as Exclude<K, "public">]: TodoItem[K]
}
type TodoItem_storage = TodoItem_without_public & {
    public?: string
}
function convertItemToStorage(item: TodoItem): TodoItem_storage {
    const storageItem: TodoItem_storage = {
        ...(item as TodoItem_without_public),
        public: (item.public) ? "x" : undefined,
    }
    return storageItem
}
function convertItemFromStorage(storageItem: TodoItem_storage): TodoItem {
    const item: TodoItem = {
        ...(storageItem as TodoItem_without_public),
        public: (storageItem.public === undefined) ? false : true,
    }
    return item
}

export class TodoAccess {
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly todoTablePublicIndex = process.env.TODOS_TABLE_PUBLIC_INDEX,
    ) { }

    async createTodo(item: TodoItem)
        : Promise<TodoItem> {
        logger.info(`create todo ${item.todoId} for user ${item.userId}`)

        await this.docClient.put({
            TableName: this.todoTable,
            Item: convertItemToStorage(item),
        }).promise()

        return item
    }

    async getSingleTodo(userId: string, todoId: string)
        : Promise<TodoItem> {
        logger.info(`get todo ${todoId} for user ${userId}`)

        const result = await this.docClient.get({
            TableName: this.todoTable,
            Key: {
                userId: userId,
                todoId: todoId,
            }
        }).promise()

        return convertItemFromStorage(result.Item as TodoItem_storage)
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

        return result.Items.map(convertItemFromStorage)
    }

    async getPublicTodosForOtherUsers(userId: string)
        : Promise<TodoItem[]> {
        logger.info(`get public todos for user ${userId}`)

        const result = await this.docClient.query({
            TableName: this.todoTable,
            IndexName: this.todoTablePublicIndex,
            KeyConditionExpression: '#P = :public',
            FilterExpression: '#U <> :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
                ':public': 'x'
            },
            ExpressionAttributeNames: {
                "#P": "public",
                "#U": "userId",
            }
        }).promise()

        return result.Items.map(convertItemFromStorage)
    }
    
    async updateTodoForUser(userId: string, todoId: string, data: TodoUpdate)
        : Promise<TodoItem> {
        logger.info(`update todo ${todoId} for user ${userId}`)

        let updateExpr = "SET #N=:name, #DD=:dueDate, #D=:done"
        let exprAttrValues = {
            ":userId": userId,
            ":name": data.name,
            ":dueDate": data.dueDate,
            ":done": data.done,
            ":public": undefined,
        }
        let exprAttrNames = {
            "#N": "name",
            "#DD": "dueDate",
            "#D": "done",
            "#P": "public",
        }

        if (data.public) {
            updateExpr += ", #P=:public"
            exprAttrValues[":public"] = "x"
        } else {
            updateExpr += " REMOVE #P"
        }

        const result = await this.docClient.update({
            TableName: this.todoTable,
            Key: {
                todoId: todoId,
                userId: userId,
            },
            // ensures that only the owner can modify the todo
            ConditionExpression: "userId = :userId",
            UpdateExpression: updateExpr,
            ExpressionAttributeNames: exprAttrNames,
            ExpressionAttributeValues: exprAttrValues,
            ReturnValues: "ALL_NEW",
        }).promise()

        return convertItemFromStorage(result.Attributes as TodoItem_storage)
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

        return convertItemFromStorage(result.Attributes as TodoItem_storage)
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
        return convertItemFromStorage(result.Attributes as TodoItem_storage)
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
