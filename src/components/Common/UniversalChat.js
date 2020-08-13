// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import { broadcastFile } from '../../actions/files';
import {
  displayUniversalChat,
  minimizeUniversalChat,
  uploadFileStart,
  uploadFileCancel,
  uploadFileSuccess,
} from '../../actions/broadcast';
import { universalChatMessage } from '../../actions/universalChat';
import './Chat.css';

// #region Helpers
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
      return <a href={file.url} rel="noopener noreferrer" target="_blank" >{file.name}</a>;
  }
};

const Message = (message: ChatFile | UniversalMessage): ReactComponent => {
  if (!message) return;
  const { isFile } = message;
  const isMe = message.userId === message.fromId;
  return (
    <div className={classNames('Message', { isMe })} key={message.timestamp}>
      <div className="MessageText">
        <div className="From">{isMe ? 'Me' : message.fromName}:</div>
        {isFile ?
          File(message) : message.text }
      </div>
    </div>
  );
};
// #endregion

// #region Type Definitions
type BaseProps = { actions?: ReactComponent };

type InitialProp = { fileSharingEnabled: boolean };

type DispatchProps ={
  sendSharedFile: (File) => void,
  broadcastSharedFile: (File) => void,
  universalChatMessage: (ChatMessagePartial) => void,
  boundUploadFileStart: (string) => void,
  boundUploadFileSuccess: (string) => void,
  boundUploadFileCancel: Unit,
  minimize: Unit,
  hide: Unit
};

type Props = BaseProps & InitialProps & DispatchProps;
// #endregion

class UniversalChat extends Component<Props> {

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

  componentDidUpdate() {
    this.updateScrollPosition();
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
        this.setState({ messages: [...this.state.messages, fileData] }, this.updateScrollPosition);
      }
    };
  }

  handleSubmit(e: SyntheticInputEvent) {
    e.preventDefault();
    const { newMessageText } = this.state;
    if (R.isEmpty(newMessageText)) { return; }

    const { sendMessage } = this.props;
    const fromId = R.path(['currentUser', 'id'], this.props);

    const message = {
      text: newMessageText,
      timestamp: Date.now(),
      fromType: 'producer',
      fromId,
    };
    sendMessage(message);
    this.setState({ newMessageText: '' }, this.updateScrollPosition);
  }

  toggleMinimize() {
    const { minimized } = this.props.chat;
    const { minimize } = this.props;

    minimize(!minimized);
  }

  render(): ReactComponent {
    const { hide, fileSharingEnabled, chat } = this.props;
    const { displayed, minimized } = this.props.chat;
    const { newMessageText } = this.state;
    const { toggleMinimize, handleSubmit, handleChange } = this;
    const ChatActions = R.propOr(null, 'actions', this.props);
    const userId = R.path(['currentUser', 'id'], this.props);
    const addUserId = R.map((message: UniversalMessage): UniversalMessage => {
      const newMessage = message;
      newMessage.userId = userId;
      return newMessage;
    });

    return (
      <div className={classNames('Chat', 'everyone', { hidden: !displayed })}>
        <div className="ChatHeader">
          <button className="btn minimize" onClick={toggleMinimize}>Chat with everyone</button>
          <button className="btn" onClick={hide}><Icon className="icon" name="close" /></button>
        </div>
        {!minimized && fileSharingEnabled &&
          <div className="ChatActions">
            { ChatActions }
            <label className="btn white ChatFileUpload" htmlFor="fileInput">
              Share file
              <input id="fileInput" style={{ display: 'none' }} type="file" onChange={this.uploadFile('File share upload')} />
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
              {R.map(Message, addUserId(chat.messages))}
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

// #region Redux Maps
const mapStateToProps: MapStateToProps<InitialProp> = (state: State): InitialProp => ({
  fileSharingEnabled: R.path(['settings', 'fileSharingEnabled'], state),
  currentUser: R.prop(['currentUser'], state),
  chat: R.path(['broadcast', 'universalChat'], state),
});

const mapDispatchToProps: MapDispatchWithOwn<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  hide: (): void => dispatch(displayUniversalChat(false)),
  minimize: (minimized: boolean): void => dispatch(minimizeUniversalChat(minimized)),
  broadcastSharedFile: (file: File): void => dispatch(broadcastFile(file)),
  sendMessage: (message: ChatMessagePartial): void => dispatch(universalChatMessage(message)),
  boundUploadFileStart: (title: string): void => dispatch(uploadFileStart(title)),
  boundUploadFileSuccess: (title: string): void => dispatch(uploadFileSuccess(title)),
  boundUploadFileCancel: (): void => dispatch(uploadFileCancel()),
});
// #endregion

export default connect(mapStateToProps, mapDispatchToProps)(UniversalChat);
