import {Contact} from './contacts.service';
import {Injectable} from "angular2/core";
import {ApplicationRef} from "angular2/core";

@Injectable()
export class ChatService {
    public sender;
    
    public getChatRooms = function() {
        let chatRooms: Contact[] = [];
        chatRooms = JSON.parse(window.localStorage.contacts);  //gets from phonebook
        return chatRooms;
    };
}
