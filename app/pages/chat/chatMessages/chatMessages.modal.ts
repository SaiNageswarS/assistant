import {Platform, NavParams, Page, ViewController} from "ionic-angular";
import {Contact} from "../../../services/contacts.service";
import {OnInit, ApplicationRef} from "angular2/core";
import {NgClass} from 'angular2/common';
import {firebaseRootRef} from '../../../services/firebase.serivce';
import {User, UserService} from '../../../services/user.service';
import {util} from "../../../util/util";

interface ChatMessage {
    type: string;
    content: any;
    read: boolean;
    sender: string;
    sentOn: number;
    firebaseId?: string;
}

declare var Firebase: any;

@Page({
    templateUrl: 'build/pages/chat/chatMessages/chatMessages.html',
    directives: [NgClass]
})
export class ChatMessagesModal implements OnInit {
    chatRoom: Contact;
    messageText = { value: ""};
    firebaseChatRoom: string;
    sender: string;
    messages: ChatMessage[];
    messageRef: any;
    
    constructor(public platform: Platform, public params: NavParams, private _applicationRef: ApplicationRef,
                public viewCtrl: ViewController) {
        this.viewCtrl = viewCtrl;
        this.chatRoom = this.params.get('room');
        var me = util.getCurrentUser();
        this.sender = me.phone;
    }
    
    // if tick is set to true tick happens
    UIRefresh(tick) {
       if (tick) {
           this._applicationRef.tick(); 
       } 
       window.setTimeout(() => {
           var contentView = document.getElementById('chat-view');
           var height = contentView.scrollHeight;
           contentView.scrollTop = height;
       }, 300);
    }
    
    private createRoom(user1:string, user2:string) {
        return (user1<=user2)?(user1 + "_" + user2):(user2 + "_" + user1);
    }

    ngOnInit() {
        var self = this;
        var lastMessageStoredTime = 0;
        try {
            self.firebaseChatRoom = self.createRoom(self.sender, self.chatRoom.phone);
            self.messages = JSON.parse(window.localStorage[self.firebaseChatRoom]) || []; 
            if (self.messages.length>25) {
                self.messages.splice(0, self.messages.length -25);   
            }
            lastMessageStoredTime = self.messages[self.messages.length - 1].sentOn;
        } catch (error) {
            self.messages = [];
        }
               
        self.messageRef = firebaseRootRef.child("/messages/"+self.firebaseChatRoom);
        self.messageRef.orderByChild("sentOn").startAt(lastMessageStoredTime)
                .on("child_added", function(snapshot) {
                    var chat: ChatMessage = snapshot.val();
                    chat.firebaseId = snapshot.key();
                    self.incrementalUpdate(chat);
                    self.markMessageRead(snapshot.key(), chat);
                    self.UIRefresh(true);        
                });
        self.messageRef.on('child_changed', function(snapshot, prevChildKey) {
            // code to handle child data changes.
            var chat = snapshot.val();
            self.incrementalUpdate(chat);
            this.UIRefresh(true);
        });
        self.UIRefresh(false); 
    }
    
    openKeyboard() {
        document.getElementById('richChatText').focus();
        this.UIRefresh(false);
    }
    
    sendMessage() {
        this.messageText.value = document.getElementById('richChatText').innerHTML;
        if (this.messageText.value && this.messageText.value.length > 0) {
            var newChatMessage = this.messageRef.push();
            var baseMsg: ChatMessage = {
                sender: this.sender,
                sentOn: Firebase.ServerValue.TIMESTAMP,
                read: false,
                type: 'text',
                content: this.messageText.value
            };
            // for (var key in chatlet) {
            //     baseMsg[key] = chatlet[key];
            // }

            newChatMessage.set(baseMsg);
            document.getElementById('richChatText').innerHTML = "";    
        }
        document.getElementById('richChatText').focus();
    }

    private markMessageRead(messageKey: string, message: ChatMessage) {
        if (message.read === false && message.sender !== this.sender) {
            var messageRef = this.messageRef.child(messageKey);
            messageRef.update({read: true});

            //var notificationRef = rootRef.child("users/" + sender);
            //notificationRef.child(self.chatSession)
            //    .transaction(function(currentVal) {
            //        return 0;
            //    });
        }
    }
    
    private incrementalUpdate(newMessage: ChatMessage) {
        if (this.messages.length === 0) {
            this.messages.push(newMessage);
            window.localStorage[this.firebaseChatRoom] = JSON.stringify(this.messages);
            return;
        }
        for (var i=this.messages.length-1; 
                 i>=0 && newMessage.sentOn <= this.messages[i].sentOn; 
                 i--) {
            if (this.messages[i].firebaseId === newMessage.firebaseId) {
                this.messages[i] = newMessage;
                window.localStorage[this.firebaseChatRoom] = JSON.stringify(this.messages);
                return;
            }
        }
        this.messages.push(newMessage);
        window.localStorage[this.firebaseChatRoom] = JSON.stringify(this.messages);
    }

    dismiss() {
        this.messageRef.off();
        this.viewCtrl.dismiss(null);
    }
}