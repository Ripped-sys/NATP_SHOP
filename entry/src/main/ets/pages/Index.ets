import { Theme } from '../theme/Theme';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { HomePage } from './HomePage';
import { MerchPage } from './MerchPage';
import { CartPage } from './CartPage';
import { ProfilePage } from './ProfilePage';
import { ProductDetailPage } from './ProductDetailPage';
import { ProfileSectionPage } from './ProfileSectionPage';
import { CheckoutPage } from './CheckoutPage';
import { BottomNavigation } from '../components/BottomNavigation';
import { StoreState } from '../model/StoreState';

@Entry
@Component
struct Index {
  @State private store: StoreState = new StoreState();
  @State private screen: string = 'login';
  @State private tab: number = 0;
  @State private productId: string = '';
  @State private section: string = 'MY ORDERS';
  @State private orderStatus: string = '全部';
  @State private merchCategory: string = 'ALL';
  private detailReturn: string = 'main';
  private sectionReturn: string = 'main';

  private signedIn(name: string): void {
    this.store.login(name);
    this.tab = 0;
    this.screen = 'main';
  }

  private openProduct(id: string): void {
    this.detailReturn = this.screen;
    this.productId = id;
    this.screen = 'detail';
  }

  private openSection(name: string, status: string = '全部'): void {
    this.sectionReturn = this.screen;
    this.section = name;
    this.orderStatus = status;
    this.screen = 'section';
  }

  private back(): boolean {
    if (this.screen === 'register') { this.screen = 'login'; return true; }
    if (this.screen === 'detail') { this.screen = this.detailReturn; return true; }
    if (this.screen === 'section') { this.screen = this.sectionReturn; return true; }
    if (this.screen === 'checkout') { this.store.directBuy = undefined; this.tab = 2; this.screen = 'main'; return true; }
    if (this.screen === 'main' && this.tab !== 0) { this.tab = 0; return true; }
    return false;
  }

  onBackPress(): boolean { return this.back(); }

  build() {
    Column() {
      Row({ space: 10 }) {
        Image($r('app.media.natp_logo')).width(38).height(32).objectFit(ImageFit.Contain)
        Text('NATP STORE').fontSize(14).fontWeight(900).letterSpacing(1.5).fontColor(Theme.text).layoutWeight(1)
        LanguageSwitch()
      }.width('100%').padding({ left: 16, right: 16, top: 8, bottom: 8 })
        .backgroundColor(Theme.background).border({ width: { bottom: 1 }, color: Theme.line })
      Column() {
      if (this.screen === 'login') {
        LoginPage({
          onLoginSuccess: (name: string) => { this.signedIn(name); },
          onJoinNATP: () => { this.screen = 'register'; }
        })
      } else if (this.screen === 'register') {
        RegisterPage({
          onRegisterSuccess: (name: string) => { this.signedIn(name); },
          onBackToLogin: () => { this.screen = 'login'; }
        })
      } else if (this.screen === 'detail') {
        ProductDetailPage({ store: this.store, productId: this.productId,
          onBack: () => { this.back(); },
          onCart: () => { this.screen = 'checkout'; }
        })
      } else if (this.screen === 'checkout') {
        CheckoutPage({ store: this.store,
          onBack: () => { this.back(); },
          onAddress: () => { this.openSection('SHIPPING ADDRESS'); },
          onDone: () => {
            this.tab = 3;
            this.screen = 'main';
            this.openSection('MY ORDERS', '待收货');
          }
        })
      } else if (this.screen === 'section') {
        ProfileSectionPage({ store: this.store, section: this.section, initialStatus: this.orderStatus,
          onBack: () => { this.back(); }, onOpenProduct: (id: string) => { this.openProduct(id); }
        })
      } else {
        Column() {
          if (this.tab === 0) {
            HomePage({ store: this.store, displayName: this.store.username,
              onOpen: (id: string) => { this.openProduct(id); },
              onShop: (category: string) => {
                this.merchCategory = category === 'T-SHIRTS' || category === 'HOODIES' ? 'CLOTHING' : category;
                this.tab = 1;
              }
            })
          } else if (this.tab === 1) {
            MerchPage({ store: this.store, category: this.merchCategory,
              onOpen: (id: string) => { this.openProduct(id); }
            })
          } else if (this.tab === 2) {
            CartPage({ store: this.store,
              onOpen: (id: string) => { this.openProduct(id); },
              onShop: () => { this.merchCategory = 'ALL'; this.tab = 1; },
              onCheckout: () => { this.store.directBuy = undefined; this.screen = 'checkout'; }
            })
          } else {
            ProfilePage({ store: this.store,
              onOpen: (name: string) => { this.openSection(name); },
              onOrders: (status: string) => { this.openSection('MY ORDERS', status); },
              onLogout: () => { this.store.logout(); this.tab = 0; this.screen = 'login'; }
            })
          }
        }.layoutWeight(1).width('100%')
        BottomNavigation({ selected: this.tab, count: this.store.cartCount(),
          onSelect: (index: number) => {
            if (index === 1 && this.tab !== 1) { this.merchCategory = 'ALL'; }
            this.tab = index;
          }
        })
      }
      }.width('100%').layoutWeight(1)
    }.width('100%').height('100%').backgroundColor(Theme.background)
  }
}
