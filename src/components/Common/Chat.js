// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import { properCase } from '../../services/util';
import { shareFile } from '../../actions/files';
import {
  sendChatMessage,
  minimizeChat,
  displayChat,
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
  const { isMe, isFile } = message;
  const messageClass = classNames('Message', { isMe });

  return (
    <div className={messageClass} key={message.timestamp}>
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
  sendMessage: (ChatMessagePartial) => void,
  boundUploadFileStart: (string) => void,
  boundUploadFileSuccess: (string) => void,
  boundUploadFileCancel: Unit,
  minimize: Unit,
  hide: Unit
};

type Props = BaseProps & InitialProps & DispatchProps;

class Chat extends Component<Props> {

  props: Props;
  state: { newMessageText: string };
  messageContainer: HTMLDivElement;
  updateScrollPosition: Unit;
  handleChange: SyntheticInputEvent => void;
  handleSubmit: SyntheticInputEvent => void;

  constructor(props: Props) {
    super(props);
    this.state = { newMessageText: '' };
    this.updateScrollPosition = this.updateScrollPosition.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillReceiveProps(nextProps: Props) {
    const newMessages = nextProps.chat.messages;
    const { messages } = this.props.chat;
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

  uploadFile(title: string): (e: SyntheticInputEvent) => AsyncVoid {
    return async (e: SyntheticInputEvent): AsyncVoid => {
      const { sendSharedFile } = this.props;
      const file = R.head(e.target.files);

      if (file) {
        await sendSharedFile(file);
      }
    };
  }

  handleSubmit(e: SyntheticInputEvent) {
    e.preventDefault();
    const { newMessageText } = this.state;
    if (R.isEmpty(newMessageText)) { return; }

    const { sendMessage, chat } = this.props;

    const message = {
      text: newMessageText,
      timestamp: Date.now(),
      fromType: chat.fromType,
      fromId: chat.fromId,
    };
    sendMessage(message);
    this.setState({ newMessageText: '' }, this.updateScrollPosition);
  }

  render(): ReactComponent {
    const { displayed, minimized, messages, toType, to } = this.props.chat;
    const name = R.prop('name', to);
    const { minimize, hide, fileSharingEnabled } = this.props;
    const { newMessageText } = this.state;
    const { handleSubmit, handleChange } = this;

    const ChatActions = R.propOr(null, 'actions', this.props);

    const chattingWithActiveFan = R.equals(toType, 'activeFan');
    const chattingWith = chattingWithActiveFan ?
      properCase(name) :
      R.cond([
        [R.equals('backstageFan'), R.always(`Backstage Fan - ${name}`)],
        [R.equals('fan'), R.always(`Fan - ${name}`)],
        [R.T, R.always(properCase(toType))],
      ])(toType);
    const inPrivateCall = R.and(chattingWithActiveFan, R.prop('inPrivateCall', this.props.chat));

    return (
      <div className={classNames('Chat', toType, { hidden: !displayed })}>
        <div className="ChatHeader">
          <button className="btn minimize" onClick={minimize}>Chat with { chattingWith }</button>
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
        {!minimized && !fileSharingEnabled && ChatActions}
        <div id={`videoActiveFan${R.prop('id', to)}`} className={classNames('ChatPrivateCall', { inPrivateCall })} />
        { !minimized &&
          <div className="ChatMain">
            <div className="ChatMessages" ref={(el: HTMLDivElement) => { this.messageContainer = el; }} >
              { R.map(Message, messages) }
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
  fileSharingEnabled: R.path(['settings', 'fileSharingEnabled'], state)
});

const mapDispatchToProps: MapDispatchWithOwn<DispatchProps, BaseProps> = (dispatch: Dispatch, ownProps: BaseProps): DispatchProps => ({
  sendSharedFile: (file: File): void => dispatch(shareFile(file, ownProps.chat)),
  sendMessage: (message: ChatMessagePartial): void => dispatch(sendChatMessage(ownProps.chat.chatId, message)),
  minimize: (): void => dispatch(minimizeChat(ownProps.chat.chatId, !ownProps.chat.minimized)),
  hide: (): void => dispatch(displayChat(ownProps.chat.chatId, false)),
  boundUploadFileStart: (title: string): void => dispatch(uploadFileStart(title)),
  boundUploadFileSuccess: (title: string): void => dispatch(uploadFileSuccess(title)),
  boundUploadFileCancel: (): void => dispatch(uploadFileCancel()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
