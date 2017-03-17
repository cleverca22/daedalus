// @flow
import { observable, action, computed } from 'mobx';
import Store from './lib/Store';

export default class SidebarStore extends Store {

  CATEGORIES = {
    WALLETS: '/wallets',
    ADA_REDEMPTION: '/ada-redemption',
  };

  INITIAL_HIDE_SUB_MENU_DELAY = 4000;
  ACTION_HIDE_SUB_MENU_DELAY = 1000;

  @observable currentCategory: ?string = null;
  @observable isShowingSubMenus: bool = true;

  _hideSubMenuTimeout = null;

  setup() {
    const actions = this.actions.sidebar;
    actions.toggleSubMenus.listen(this._toggleSubMenus);
    actions.sidebarCategorySelected.listen(this._onSidebarCategorySelected);
    actions.walletSelected.listen(this._onWalletSelected);
    this.actions.networkStatus.isSyncedAndReady.listen(() => {
      this._hideSubMenusAfterDelay(this.INITIAL_HIDE_SUB_MENU_DELAY);
    });
    this.registerReactions([
      this._syncSidebarRouteWithRouter,
    ]);
  }

  @computed get wallets(): Array<SidebarWalletType> {
    const { wallets, networkStatus } = this.stores;
    return wallets.all.map(w => ({
      id: w.id,
      title: w.name,
      info: `${w.amount} ${w.currency}`,
      isConnected: networkStatus.isConnected,
    }));
  }

  @action showCategoryWithSubMenus = (category: string) => {
    this.currentCategory = category;
    this.isShowingSubMenus = true;
    this._clearExistingHideSubMenuTimeout();
  };

  @action _toggleSubMenus = () => {
    this.isShowingSubMenus = !this.isShowingSubMenus;
    this._clearExistingHideSubMenuTimeout();
  };

  @action _hideSubMenus = () => {
    this.isShowingSubMenus = false;
    this._clearExistingHideSubMenuTimeout();
  };

  @action _onSidebarCategorySelected = ({ category }: { category: string }) => {
    if (category !== this.currentCategory) {
      this.actions.router.goToRoute({route: category});
      this.currentCategory = category;
      this.isShowingSubMenus = true;
    } else {
      this._toggleSubMenus();
    }
  };

  @action _hideSubMenusAfterDelay = (delay: number) => {
    this._clearExistingHideSubMenuTimeout();
    this._hideSubMenuTimeout = setTimeout(this._hideSubMenus, delay);
  };

  @action _onWalletSelected = ({ walletId }) => {
    this.stores.wallets.goToWalletRoute(walletId);
    this._hideSubMenusAfterDelay(this.ACTION_HIDE_SUB_MENU_DELAY);
  };

  @action _setCurrentCategory = (category: string) => {
    this.currentCategory = category;
  };

  _syncSidebarRouteWithRouter = () => {
    const route = this.stores.app.currentRoute;
    Object.keys(this.CATEGORIES).forEach((key) => {
      const category = this.CATEGORIES[key];
      if (route.indexOf(category) !== -1) this._setCurrentCategory(category);
    });
  };

  _clearExistingHideSubMenuTimeout() {
    if (this._hideSubMenuTimeout) clearTimeout(this._hideSubMenuTimeout);
  }

}

export type SidebarWalletType = {
  id: string,
  title: string,
  info: string,
  isConnected: bool,
};
