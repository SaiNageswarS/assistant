import {Page, Modal, NavController} from 'ionic-angular';
import {OnInit, ApplicationRef} from "angular2/core";
import {ChatService} from "../../services/chat.service";
import {Contact} from "../../services/contacts.service";
import {ChatMessagesModal} from "./chatMessages/chatMessages.modal";
import {ContactsService} from "../../services/contacts.service";

@Page({
    templateUrl: 'build/pages/chat/chat.html',
    providers: [ChatService, ContactsService]
})
export class Chat implements OnInit {
    public chatRooms: Contact[] = [];
    showSearch: boolean = false;
    isSyncing = false;
    isSearching = false;

    constructor(private _chatService: ChatService, private nav: NavController,
                private _applicationRef: ApplicationRef,
                private _contactsService: ContactsService) {}

    openChatRoom(chatRoom: Contact) {
        let modal = Modal.create(ChatMessagesModal, { room: chatRoom });
        this.nav.present(modal);
    };

    openChatRoomSearch() {
        this.isSearching = true;
    };

    getContacts(searchBar) {

    };

    dismiss() {
        this.isSearching = false;
    }

    syncContacts() {
        this.isSyncing = true;
        let syncPromise: Promise = this._contactsService.syncContacts();

        syncPromise.then(() => {
                this.isSyncing = false;
                this.chatRooms = this._chatService.getChatRooms();
                this._applicationRef.tick();
            })
            .catch(err => console.log("err in login " + JSON.stringify(err)));
    }

    ngOnInit() {
        this.chatRooms = this._chatService.getChatRooms();
    }
}
