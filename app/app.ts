import 'es6-shim';
import {App, Platform} from 'ionic-angular';
import {StatusBar} from 'ionic-native';
import {TabsPage} from './pages/tabs/tabs';
import {UserService} from "./services/user.service";
import {Login} from './pages/login/login'

@App({
  template: '<ion-nav [root]="rootPage"></ion-nav>',
  providers: [UserService],
  config: {} // http://ionicframework.com/docs/v2/api/config/Config/
})
export class MyApp {
  private getRootPage = function () {
    let uid = this._userService.checkLoggedIn();
    return (uid) ? TabsPage : Login;
  };

  rootPage: any;

  constructor(platform: Platform, private _userService:UserService) {
    this.rootPage = this.getRootPage();
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.backgroundColorByHexString("#df3a3a");
    });
  }
}
