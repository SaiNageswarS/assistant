import {Page, Modal, Alert, NavController} from 'ionic-angular';
import {OnInit, ApplicationRef} from 'angular2/core';
import {User, UserService} from '../../services/user.service.ts';
import {TabsPage} from "../tabs/tabs";
import {ContactsService} from "../../services/contacts.service";

@Page({
    templateUrl: 'build/pages/login/login.html',
    providers: [UserService, ContactsService]
})

export class Login implements OnInit {
    constructor(private nav: NavController, private _userService: UserService, private _applicationRef: ApplicationRef,
                    private _contactsService: ContactsService) {}

    public state = { value: 'init' };
    public stateMessages = {
        'init' : '',
        'login': 'Logging In...',
        'sync': 'Syncing Contacts',
        'syncFinished': 'Finished syncing contacts'
    };

    ngOnInit() {
        //Todo: Remove this in prod app
        if (window.plugins) {
            window.plugins.digits.logout();
            window.plugins.digits.authenticate({},  (oAuthHeaders) => {
                    console.log(oAuthHeaders);
                    this.login(oAuthHeaders.phone);
                },
                (error) => {
                    console.warn("[Digits]", "Login failed", error);
                });
        }
        else {
            this.login("+61451010144");
        }
    }

    public navigateToTabsPage = function() {
        this.nav.setRoot(TabsPage);
    };

    private login(phone: string) {
        this.state.value = 'login';
        this._userService.login(phone)
            .catch(err => {
                this.state.value = 'init';
                let alert = Alert.create({
                    title: 'Network Error',
                    message: 'Please make sure you are connected to internet',
                    buttons: ['Ok']
                });
                this.nav.present(alert);
            })
            .then(_ => {
                this.state.value = 'sync';
                this._applicationRef.tick();
                let syncPromise: Promise = this._contactsService.syncContacts();

                syncPromise.then(() => {
                        this.state.value = 'syncFinished';
                        this._applicationRef.tick();
                    })
                    .catch(err => console.log("err in login " + JSON.stringify(err)));
            });
    };
}
