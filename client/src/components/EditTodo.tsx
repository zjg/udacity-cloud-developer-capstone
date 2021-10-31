import * as React from 'react'
import { Form, Button } from 'semantic-ui-react'
import Auth from '../auth/Auth'
import { getUploadUrl, uploadFile, getSingleTodo, patchTodo } from '../api/todos-api'
import { useParams } from 'react-router'

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile,
}

interface EditTodoProps {
  match: {
    params: {
      todoId: string
    }
  }
  auth: Auth
}

interface EditTodoState {
  file: any
  uploadState: UploadState
  name: string
  dueDate: string
  public: boolean
  done: boolean
  loading: boolean
  updatingProps: boolean
}

export class EditTodo extends React.PureComponent<
  EditTodoProps,
  EditTodoState
> {
  state: EditTodoState = {
    file: undefined,
    uploadState: UploadState.NoUpload,
    name: '',
    dueDate: '',
    public: false,
    done: false,
    loading: true,
    updatingProps: false,
  }

  async componentDidMount() {
    try {
      const todo = await getSingleTodo(this.props.auth.getIdToken(), this.props.match.params.todoId)
      this.setState({
        loading: false,
        name: todo.name,
        dueDate: todo.dueDate,
        done: todo.done,
        public: todo.public,
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${e}`)
    }
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    this.setState({
      file: files[0]
    })
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!this.state.file) {
        alert('File should be selected')
        return
      }

      this.setUploadState(UploadState.FetchingPresignedUrl)
      const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), this.props.match.params.todoId)

      this.setUploadState(UploadState.UploadingFile)
      await uploadFile(uploadUrl, this.state.file)

      alert('File was uploaded!')
    } catch (e) {
      alert(`Could not upload a file: ${e}`)
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }

  updateProps = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!this.state.name.match("[^ ]+")) {
        alert('Name cannot be blank')
        return
      }

      this.setState({updatingProps: true})
      await patchTodo(this.props.auth.getIdToken(), this.props.match.params.todoId, {
        name: this.state.name,
        dueDate: this.state.dueDate,
        done: this.state.done,
        public: this.state.public,
      })
    } catch (e) {
      alert(`Could not update props: ${e}`)
    } finally {
      this.setState({updatingProps: false})
    }
  }

  nameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({name: event.target.value})
  }
  dueDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({dueDate: event.target.value})
  }
  publicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({public: event.target.checked})
  }
  doneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({done: event.target.checked})
  }

  render() {
    return (
      <div>
        <h1>Upload new image</h1>

        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>File</label>
            <input
              type="file"
              accept="image/*"
              placeholder="Image to upload"
              onChange={this.handleFileChange}
            />
          </Form.Field>

          {this.renderButton()}
        </Form>
        <h1>Modify Properties</h1>
        <Form onSubmit={this.updateProps}>
          <Form.Field>
            <label>Name</label>
            <input type="text" name="name" value={this.state.name} onChange={this.nameChange}/>
          </Form.Field>
          <Form.Field>
            <label>Due Date</label>
            <input type="date" name="dueDate" value={this.state.dueDate} onChange={this.dueDateChange}/>
          </Form.Field>
          <Form.Field>
            <label>Public</label>
            <input type="checkbox" name="public" checked={this.state.public} onChange={this.publicChange}/>
          </Form.Field>
          <Form.Field>
            <label>Done</label>
            <input type="checkbox" name="done" checked={this.state.done} onChange={this.doneChange}/>
          </Form.Field>
          {this.renderPropsButton()}
        </Form>
      </div>
    )
  }

  renderButton() {

    return (
      <div>
        {this.state.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        <Button
          loading={this.state.uploadState !== UploadState.NoUpload}
          type="submit"
        >
          Upload
        </Button>
      </div>
    )
  }
  renderPropsButton() {

    return (
      <div>
        <Button
          loading={this.state.updatingProps}
          type="submit"
        >
          Update TODO
        </Button>
      </div>
    )
  }
}
