import {Injectable, Inject} from "angular2/core";
import {firebaseRootRef} from "./firebase.serivce.ts";
import {Platform} from "ionic-angular";
import {Contacts} from 'ionic-native';
import {util} from '../util/util';
import {UserService} from "./user.service";

export interface Contact {
    name: string;
    phone: string;
    chatroom?: string;
    lastupdatedOn?: string;
}

@Injectable()
export class ContactsService {
    constructor(public platform: Platform, @Inject(UserService) userService: UserService) {}
    
    private saveContactsToFirebase(contacts: Contact[]) {
        var authUuid = firebaseRootRef.getAuth().uid;
        var contactRef = firebaseRootRef.child("/contacts/" + authUuid);
        contactRef.remove((error) => {
            if (!error) {
                contacts.forEach(contact => {
                    var newContactRef = contactRef.push(); 
                    newContactRef.set(contact);
                });
            }
        });
    }

    private removeDuplicateContacts(filteredContacts) {
        //remove duplicates
        var contactSet = {};
        var myContacts: Contact[] = [];
        var me = util.getCurrentUser();

        for (var idx in filteredContacts) {
            if (!contactSet[filteredContacts[idx].phone] && filteredContacts[idx].phone !== me.phone) {
                contactSet[filteredContacts[idx].phone] = true;
                myContacts.push(filteredContacts[idx]);
            }
        }
        return myContacts;
    };

    private syncContactsWithFirebase(contactsRetrieved) {
        var self = this;
        var firebaseUserRef = firebaseRootRef.child('users');

        var contactsFlat: Contact[] =
            contactsRetrieved
                .map(contactRetrieved => {
                    let baseContacts = [];
                    contactRetrieved.phoneNumbers
                        .forEach(phoneNumber => {
                            let baseContact: Contact = { name: contactRetrieved.displayName, phone: '' };
                            baseContact.phone = phoneNumber.value;
                            baseContacts.push(baseContact)
                        });
                    return baseContacts;
                })
                .reduce((contact1, contact2) => contact1.concat(contact2));

        let filterPromises =
            contactsFlat
                .map((contact: Contact) =>
                    new Promise((resolve, reject) => {
                        try {
                            contact.phone = util.standardizePhone(contact.phone);
                            firebaseUserRef.child(contact.phone).once('value', (snapshot) => {
                                (snapshot.exists())? resolve(contact) : resolve(null);
                            })
                        } catch (err) {
                            resolve(null);
                        }
                    }));

        return Promise.all(filterPromises);
    };

    syncContacts() {
        var self = this;
        return new Promise((resolve, reject) => {
            self.platform.ready().then(() => {
                
                Contacts.find(["*"], {multiple: true, hasPhoneNumber: true})
                    .then(contacts => {
                            var syncPromises = self.syncContactsWithFirebase(contacts);

                            syncPromises.then(filteredContacts => {
                                filteredContacts = filteredContacts
                                    .filter(contact => contact!==null);
                                filteredContacts = self.removeDuplicateContacts(filteredContacts);
                                self.saveContactsToFirebase(filteredContacts);
                                window.localStorage.contacts = JSON.stringify(filteredContacts);
                                resolve();
                            }).catch(err => reject(err));
                        })
                    .catch(err => {
                        firebaseRootRef
                            .child("contacts/" + firebaseRootRef.getAuth().uid)
                            .once("value", (snapshot) => {
                                var fetchedContacts = [];
                                snapshot.forEach(childSnapshot => { fetchedContacts.push(childSnapshot.val()) });
                                window.localStorage.contacts = JSON.stringify(fetchedContacts);
                                resolve();
                            })
                    });
                
            });
        });
    }
}