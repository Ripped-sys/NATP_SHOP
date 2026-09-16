import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';
import { SiteButton } from '../components/SiteButton';
import { StoreState } from '../model/StoreState';
import { Product, MockOrder } from '../model/Product';
import { NATPHeader } from '../components/NATPHeader';
import { EmptyState } from '../components/EmptyState';
import { ProductCard } from '../components/ProductCard';
import { CategoryBar } from '../components/CategoryBar';

@Component
export struct ProfileSectionPage {
  @StorageLink('natpLanguage') private language: string = 'zh';

  private t(key: string): string { return tr(this.language, key); }

  @ObjectLink store: StoreState;
  section: string = 'MY ORDERS';
  initialStatus: string = '全部';
  @State private status: string = '全部';
  @State private receiver: string = '';
  @State private phone: string = '';
  @State private address: string = '';
  @State private noticeKey: string = '';
  onBack: () => void = () => {};
  onOpenProduct: (id: string) => void = () => {};
  private statuses: string[] = ['全部', '待付款', '待发货', '待收货', '已完成'];

  aboutToAppear(): void {
    this.status = this.initialStatus;
    this.receiver = this.store.receiver;
    this.phone = this.store.phone;
    this.address = this.store.address;
  }

  private saveAddress(): void {
    if (this.receiver.trim().length === 0 || !/^1[3-9]\d{9}$/.test(this.phone) || this.address.trim().length < 5) {
      this.noticeKey = 'addressInvalid';
      return;
    }
    this.store.receiver = this.receiver.trim();
    this.store.phone = this.phone;
    this.store.address = this.address.trim();
    this.noticeKey = 'addressSaved';
  }

  @Builder
  orders() {
    CategoryBar({ categories: this.statuses, selected: this.status,
      onSelect: (value: string) => { this.status = value; } })
    List({ space: 12 }) {
      if (this.store.orders.filter((order: MockOrder) => this.status === '全部' || order.status === this.status).length === 0) {
        ListItem() { EmptyState({ titleKey: 'noOrders', bodyKey: 'noOrdersBody' }) }
      }
      ForEach(this.store.orders.filter((order: MockOrder) => this.status === '全部' || order.status === this.status),
        (order: MockOrder) => {
          ListItem() {
            Column({ space: 12 }) {
              Text('NO. ' + order.id).fontSize(11).fontColor(Theme.muted)
              Text(this.t(order.status)).fontSize(18).fontColor(Theme.cyan).fontWeight(900)
              Text(order.count + ' ' + this.t('items') + ' / ¥' + order.total.toFixed(2)).fontSize(16).fontColor(Theme.text)
              Text(this.t('demoOrder')).fontSize(12).fontColor(Theme.muted)
            }.width('100%').alignItems(HorizontalAlign.Start).padding(20)
              .backgroundColor(Theme.surface).border({ width: 1, color: Theme.line })
          }
        }, (order: MockOrder) => order.id)
    }.layoutWeight(1).padding(20).scrollBar(BarState.Off)
  }

  build() {
    Column({ space: 12 }) {
      SiteButton({ label: this.t('back'), kind: 'secondary', buttonHeight: 44, onAction: this.onBack })
      NATPHeader({ titleKey: this.section, eyebrow: 'NATP / MEMBER ACCESS' })
      if (this.section === 'MY ORDERS') {
        this.orders()
      } else if (this.section === 'FAVORITES') {
        if (this.store.favorites.length === 0) {
          EmptyState({ titleKey: 'noFavorites', bodyKey: 'noFavoritesBody' })
        } else {
          Grid() {
            ForEach(this.store.products.filter((product: Product) => this.store.favorites.includes(product.id)),
              (product: Product) => {
                GridItem() {
                  ProductCard({ product: product, favorite: true, onOpen: this.onOpenProduct,
                    onFavorite: (id: string) => { this.store.toggleFavorite(id); } })
                }
              }, (product: Product) => product.id)
          }.columnsTemplate('1fr 1fr').columnsGap(12).rowsGap(12).layoutWeight(1).padding(20).scrollBar(BarState.Off)
        }
      } else {
        Scroll() {
          Column({ space: 18 }) {
            if (this.section === 'SHIPPING ADDRESS') {
              TextInput({ placeholder: this.t('receiver'), text: this.receiver }).height(52)
                .backgroundColor(Theme.surface).fontColor(Theme.text).placeholderColor(Theme.muted)
                .borderRadius(0).border({ width: 1, color: Theme.line })
                .onChange((value: string) => { this.receiver = value; this.noticeKey = ''; })
              TextInput({ placeholder: this.t('phonePlaceholder'), text: this.phone }).height(52).type(InputType.PhoneNumber).maxLength(11)
                .backgroundColor(Theme.surface).fontColor(Theme.text).placeholderColor(Theme.muted)
                .borderRadius(0).border({ width: 1, color: Theme.line })
                .onChange((value: string) => { this.phone = value; this.noticeKey = ''; })
              TextArea({ placeholder: this.t('addressPlaceholder'), text: this.address }).height(110)
                .backgroundColor(Theme.surface).fontColor(Theme.text).placeholderColor(Theme.muted)
                .borderRadius(0).border({ width: 1, color: Theme.line })
                .onChange((value: string) => { this.address = value; this.noticeKey = ''; })
              SiteButton({ label: this.t('saveAddress'), onAction: () => { this.saveAddress(); } })
              if (this.noticeKey.length > 0) {
                Text(this.t(this.noticeKey)).fontSize(13).lineHeight(22)
                  .fontColor(this.noticeKey === 'addressSaved' ? Theme.cyan : Theme.danger)
              }
            } else if (this.section === 'ACCOUNT') {
              Image($r('app.media.natp_logo')).width(96).height(78).objectFit(ImageFit.Contain)
              Text(this.store.username).fontSize(26).fontWeight(900).fontColor(Theme.text)
              Text(this.t('member')).fontSize(13).fontColor(Theme.cyan)
            } else if (this.section === 'ABOUT NATP') {
              Image($r('app.media.natp_live_wide')).width('100%').aspectRatio(1.5).objectFit(ImageFit.Cover)
              Text(this.t('aboutTitle')).fontSize(28).fontWeight(900).fontColor(Theme.text).lineHeight(34)
              Text(this.t('aboutBody')).fontSize(14).fontColor(Theme.muted).lineHeight(24)
              Text('Hard Rock / Alternative Rock / Thrash Metal\nBlues Rock / Metalcore / Guitar Driven')
                .fontSize(12).fontColor(Theme.cyan).lineHeight(23)
              Text(this.t('archive')).fontSize(13).fontWeight(900).fontColor(Theme.text)
              Image($r('app.media.natp_epk')).width('100%').aspectRatio(2267 / 1124).objectFit(ImageFit.Contain)
              Text(this.t('archiveNote')).fontSize(10).fontColor(Theme.dim)
            } else {
              Text(this.t('contactTitle')).fontSize(24).fontWeight(900).fontColor(Theme.text)
              Text(this.t('contactPending')).fontSize(14).fontColor(Theme.muted)
              Text(this.t('website')).fontSize(13).fontWeight(900).fontColor(Theme.cyan)
              Text('https://ripped-sys.github.io/NATP-band-website/')
                .fontSize(13).fontColor(Theme.text).copyOption(CopyOptions.LocalDevice)
              Text(this.t('websiteNote')).fontSize(11).fontColor(Theme.dim)
            }
          }.width('100%').alignItems(HorizontalAlign.Start).padding(20)
        }.layoutWeight(1).width('100%').scrollBar(BarState.Off).align(Alignment.Top)
      }
    }.width('100%').height('100%').backgroundColor(Theme.background)
  }
}
