import {Page} from 'ionic-angular';
import {Feed} from '../feed/feed';
import {Calendar} from '../calendar/calendar';
import {Chat} from '../chat/chat';


@Page({
  templateUrl: 'build/pages/tabs/tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root: any = Feed;
  tab2Root: any = Calendar;
  tab3Root: any = Chat;
}
