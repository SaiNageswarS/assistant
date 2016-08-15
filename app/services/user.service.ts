import {Injectable} from "angular2/core";
import {firebaseRootRef} from "./firebase.serivce";
import {util} from '../util/util';

export interface User {
    phone: string;
    countryCode: string;
}

declare var localStorage;

@Injectable()
export class UserService {
    private signup(phone: string) {
        var response = new Promise((resolve, reject) => {
            firebaseRootRef.createUser({
                email: phone + '@asst.com',
                password: "14a3694a-374f-4976-8306-41ac8655983a"
            }, function(err, userData) {
                if (err) {
                    reject(err);
                }
                else {
                    var user: User = {
                        phone: phone,
                        countryCode: util.getCountryCode(phone)
                    };
                    firebaseRootRef.child('users/' + phone).set(user);
                    resolve();
                }
            });
        });
        return response;
    }

    public login(phone: string) {
        var self = this;

        var response = new Promise((resolve, reject) => {
            firebaseRootRef.authWithPassword({
                    email: phone + '@asst.com',
                    password: '14a3694a-374f-4976-8306-41ac8655983a'
                },
                function(err, authData) {
                    if (err) {
                        switch (err.code) {
                            case "INVALID_USER" :
                                //if user is not present then signup and attempt login again
                                self.signup(phone)
                                    .then(_ => self.login(phone).then(_ => resolve()))
                                    .catch(err => reject(err));
                                break;
                            default:
                                return reject(err);
                        }
                    }
                    else {
                        //save user login
                        var user: User = {
                            phone: phone,
                            countryCode: util.getCountryCode(phone)
                        };
                        localStorage.uid = JSON.stringify(user);
                        resolve();
                    }
                });
        });
        return response;
    }

    // check if user is logged in firebase
    public checkLoggedIn() {
        return firebaseRootRef.getAuth();
    }
}