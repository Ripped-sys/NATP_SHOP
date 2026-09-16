import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';
import { SiteButton } from '../components/SiteButton';
import { StoreState } from '../model/StoreState';
import { CartItem, Product } from '../model/Product';
import { NATPHeader } from '../components/NATPHeader';
import { EmptyState } from '../components/EmptyState';

@Component
export struct CartPage {
  @StorageLink('natpLanguage') private language: string = 'zh';

  private t(key: string): string { return tr(this.language, key); }

  @ObjectLink store: StoreState;
  @State private noticeKey: string = '';
  onShop: () => void = () => {};
  onOpen: (id: string) => void = () => {};
  onCheckout: () => void = () => {};

  @Builder
  cartRow(item: CartItem, product: Product) {
    Column({ space: 14 }) {
      Row({ space: 14 }) {
        Image(product.image).width(84).height(100).objectFit(ImageFit.Cover)
          .onClick(() => { this.onOpen(product.id); })
        Column({ space: 8 }) {
          Text(this.language === 'en' && product.englishName.length > 0 ? product.englishName : product.name)
            .fontColor(Theme.text).fontSize(14).maxLines(2).onClick(() => { this.onOpen(product.id); })
          Text(this.t('size') + ' / ' + (item.size === '均码' ? this.t('oneSize') : item.size))
            .fontColor(Theme.muted).fontSize(12)
          Text('¥' + product.price.toFixed(2)).fontColor(Theme.text).fontSize(16).fontWeight(900)
        }.layoutWeight(1).alignItems(HorizontalAlign.Start)
      }.width('100%')
      Row({ space: 10 }) {
        SiteButton({ label: '−', kind: 'secondary', buttonHeight: 44, available: item.quantity > 1,
          onAction: () => { this.store.changeQuantity(item.productId, item.size, -1); } }).width(44)
        Text(item.quantity.toString()).fontColor(Theme.text).fontSize(14)
        SiteButton({ label: '+', kind: 'secondary', buttonHeight: 44,
          onAction: () => {
            const before: number = this.store.cartCount();
            this.store.changeQuantity(item.productId, item.size, 1);
            this.noticeKey = before === this.store.cartCount() ? 'stockLimit' : '';
          } }).width(44)
        Blank()
        SiteButton({ label: this.t('remove'), kind: 'danger', buttonHeight: 44,
          onAction: () => { this.store.removeCart(item.productId, item.size); this.noticeKey = ''; } }).width(88)
      }.width('100%')
    }.width('100%').padding(14).backgroundColor(Theme.surface).border({ width: 1, color: Theme.line })
  }

  build() {
    Column() {
      NATPHeader({ titleKey: 'yourCart', eyebrow: '02 / YOUR SELECTION' })
      if (this.store.cart.length === 0) {
        Column() {
          EmptyState({ titleKey: 'cartEmpty', bodyKey: 'cartEmptyBody', actionKey: 'explore', onAction: this.onShop })
        }.layoutWeight(1).justifyContent(FlexAlign.Center)
      } else {
        List({ space: 12 }) {
          ForEach(this.store.cart, (item: CartItem) => {
            ListItem() {
              if (this.store.findProduct(item.productId)) {
                this.cartRow(item, this.store.findProduct(item.productId)!)
              }
            }
          }, (item: CartItem) => JSON.stringify([item.productId, item.size]))
        }.layoutWeight(1).padding({ left: 20, right: 20 }).scrollBar(BarState.Off)
      }
      if (this.noticeKey.length > 0) { Text(this.t(this.noticeKey)).fontColor(Theme.danger).fontSize(12).padding(10) }
      Row({ space: 18 }) {
        Column({ space: 5 }) {
          Text(this.t('total')).fontColor(Theme.muted).fontSize(11)
          Text('¥' + this.store.total().toFixed(2)).fontColor(Theme.text).fontSize(26).fontWeight(900)
        }.layoutWeight(1).alignItems(HorizontalAlign.Start)
        SiteButton({ label: this.t('checkout'), available: this.store.cart.length > 0, onAction: this.onCheckout })
          .layoutWeight(1)
      }.padding(20).width('100%').backgroundColor(Theme.surface).border({ width: { top: 1 }, color: Theme.line })
    }.width('100%').height('100%').backgroundColor(Theme.background)
  }
}
