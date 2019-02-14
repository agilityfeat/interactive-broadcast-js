// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import { broadcastFile } from '../../actions/files';
import {
  displayGlobalChat,
  minimizeGlobalChat,
  broadcastChatMessage,
  uploadFileStart,
  uploadFileCancel,
  uploadFileSuccess,
} from '../../actions/broadcast';
import './Chat.css';

const File = (file: ChatFile): ReactComponent => {
  switch (file.type.split('/')[0]) {
    case 'image':
      return (
        <a rel="noopener noreferrer" target="_blank" href={file.url}>
          <img className="ChatImage" alt={file.name} src={file.url} />
        </a>
      );
    case 'video':
      return <video controls className="ChatImage" src={file.url} />;
    default:
      return <a href={file.url}>{file.name}</a>;
  }
};

const Message = (message: ChatFile | ChatMessage): ReactComponent => {
  const { isFile } = message;

  return (
    <div className="Message isMe" key={message.timestamp}>
      <div className="MessageText">
        {isFile ?
          File(message) : message.text }
      </div>
    </div>
  );
};

type BaseProps = {
  actions?: ReactComponent
};

type InitialProp = {
  fileSharingEnabled: boolean
};

type DispatchProps ={
  sendSharedFile: (File) => void,
  broadcastSharedFile: (File) => void,
  sendMessage: (ChatMessagePartial) => void,
  broadcastChatMessage: (ChatMessagePartial) => void,
  boundUploadFileStart: (string) => void,
  boundUploadFileSuccess: (string) => void,
  boundUploadFileCancel: Unit,
  minimize: Unit,
  hide: Unit
};

type Props = BaseProps & InitialProps & DispatchProps;

class BroadcastChat extends Component<Props> {

  props: Props;
  state: { newMessageText: string };
  messageContainer: HTMLDivElement;
  updateScrollPosition: Unit;
  handleChange: SyntheticInputEvent => void;
  handleSubmit: SyntheticInputEvent => void;
  toggleMinimize: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      newMessageText: '',
      messages: [],
    };

    this.updateScrollPosition = this.updateScrollPosition.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.toggleMinimize = this.toggleMinimize.bind(this);
  }

  componentDidUpdate(nextProps: Props, prevState: State) {
    const newMessages = this.state.messages;
    const { messages } = prevState;

    if (newMessages.length > messages.length) {
      this.updateScrollPosition();
    }
  }

  handleChange(e: SyntheticInputEvent) {
    const newMessageText = e.target.value;
    this.setState({ newMessageText });
  }

  updateScrollPosition() {
    const { messageContainer } = this;
    setTimeout(() => {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }, 0);
  }

  uploadFile(): (e: SyntheticInputEvent) => AsyncVoid {
    return async (e: SyntheticInputEvent): AsyncVoid => {
      const { broadcastSharedFile } = this.props;
      const file = R.head(e.target.files);

      if (file) {
        const fileData = await broadcastSharedFile(file);
        this.setState({ messages: [...this.state.messages, fileData ] }, this.updateScrollPosition);
      }
    };
  }

  handleSubmit(e: SyntheticInputEvent) {
    e.preventDefault();
    const { newMessageText } = this.state;
    if (R.isEmpty(newMessageText)) { return; }

    const { broadcastMessage } = this.props;
    const fromId = R.path(['currentUser', 'id'], this.props);

    const message = {
      text: newMessageText,
      timestamp: Date.now(),
      fromType: 'producer',
      fromId,
    };
    // sendMessage(message);
    broadcastMessage(message);
    this.setState({ newMessageText: '', messages: [...this.state.messages, message] }, this.updateScrollPosition);
  }

  toggleMinimize() {
    const { minimized } = this.props.chat;
    const { minimize } = this.props;

    minimize(!minimized);
  }

  render(): ReactComponent {
    const { hide, fileSharingEnabled } = this.props;
    const { displayed, minimized } = this.props.chat;
    const { newMessageText, messages } = this.state;
    const { toggleMinimize, handleSubmit, handleChange } = this;
    const ChatActions = R.propOr(null, 'actions', this.props);


    return (
      <div className={classNames('Chat', 'everyone', { hidden: !displayed })}>
        <div className="ChatHeader">
          <button className="btn minimize" onClick={toggleMinimize}>Chat with everyone</button>
          <button className="btn" onClick={hide}><Icon className="icon" name="close" /></button>
        </div>
        {!minimized && fileSharingEnabled &&
          <div className="ChatActions">
            { ChatActions }
            <label className="btn white ChatFileUpload">
              Share file
              <input style={{ display: 'none' }} type="file" onChange={this.uploadFile('File share upload')} />
            </label>
          </div>
        }
        {!minimized && !fileSharingEnabled &&
          <div className="ChatActions">
            { ChatActions }
          </div>
        }
        { !minimized &&
          <div className="ChatMain">
            <div className="ChatMessages" ref={(el: HTMLDivElement) => { this.messageContainer = el; }} >
              {R.map(Message, messages)}
            </div>
            <form className="ChatForm" onSubmit={handleSubmit}>
              <input
                autoComplete="off"
                type="text"
                name="newMessageText"
                placeholder="Write a message . . ."
                value={newMessageText}
                onChange={handleChange}
              />
              <button type="submit" className="btn"><Icon className="icon" name="check" /></button>
            </form>
          </div>
        }
      </div>
    );
  }
}

const mapStateToProps: MapStateToProps<InitialProp> = (state: State): InitialProp => ({
  fileSharingEnabled: R.path(['settings', 'fileSharingEnabled'], state),
  currentUser: R.prop(['currentUser'], state),
  chat: R.path(['broadcast', 'globalChat'], state),
});

const mapDispatchToProps: MapDispatchWithOwn<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  hide: (): void => dispatch(displayGlobalChat(false)),
  minimize: (minimized: boolean): void => dispatch(minimizeGlobalChat(minimized)),
  broadcastSharedFile: (file: File): void => dispatch(broadcastFile(file)),
  broadcastMessage: (message: ChatMessagePartial): void => dispatch(broadcastChatMessage(message)),
  boundUploadFileStart: (title: string): void => dispatch(uploadFileStart(title)),
  boundUploadFileSuccess: (title: string): void => dispatch(uploadFileSuccess(title)),
  boundUploadFileCancel: (): void => dispatch(uploadFileCancel()),
});

export default connect(mapStateToProps, mapDispatchToProps)(BroadcastChat);
