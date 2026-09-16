import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';
import { SiteButton } from '../components/SiteButton';
import { StoreState } from '../model/StoreState';
import { Product } from '../model/Product';
import { EmptyState } from '../components/EmptyState';

@Component
export struct ProductDetailPage {
  @StorageLink('natpLanguage') private language: string = 'zh';

  private t(key: string): string { return tr(this.language, key); }

  @ObjectLink store: StoreState;
  productId: string = '';
  @State private selectedSize: string = '';
  @State private quantity: number = 1;
  @State private noticeKey: string = '';
  onBack: () => void = () => {};
  onCart: () => void = () => {};

  aboutToAppear(): void {
    const product: Product | undefined = this.store.findProduct(this.productId);
    this.selectedSize = product && product.sizes.length > 0 ? product.sizes[0] : '均码';
  }

  private add(buyNow: boolean): void {
    if (buyNow) {
      if (this.store.prepareBuy(this.productId, this.selectedSize, this.quantity)) { this.onCart(); }
      else { this.noticeKey = 'unavailable'; }
      return;
    }
    this.noticeKey = this.store.addCart(this.productId, this.selectedSize, this.quantity) ? 'added' : 'unavailable';
  }

  @Builder
  detail(product: Product) {
    Scroll() {
      Column({ space: 18 }) {
        Image(product.image).width('100%').aspectRatio(0.9).objectFit(ImageFit.Cover)
        Column({ space: 16 }) {
          Row() {
            Text(this.t(product.isLimited ? 'limitedEdition' : 'official')).fontColor(Theme.cyan).fontSize(11).layoutWeight(1)
            Button({ type: ButtonType.Normal }) {
              Image(this.store.favorites.includes(product.id) ? $r('app.media.icon_heart_cyan') : $r('app.media.icon_heart_gray'))
                .width(22).height(22)
            }.width(44).height(44).backgroundColor(Theme.surface).borderRadius(0)
              .border({ width: 1, color: Theme.line })
              .accessibilityText(this.t(this.store.favorites.includes(product.id) ? 'unfavorite' : 'favorite'))
              .onClick(() => { this.store.toggleFavorite(product.id); })
          }.width('100%')
          Text(this.language === 'en' && product.englishName.length > 0 ? product.englishName : product.name)
            .fontColor(Theme.text).fontSize(28).fontWeight(900)
          Text(product.price > 0 ? '¥' + product.price.toFixed(2) : this.t('pricePending'))
            .fontColor(product.price > 0 ? Theme.text : Theme.cyan).fontSize(28).fontWeight(900)
          Text(this.t('description')).fontColor(Theme.cyan).fontSize(11).fontWeight(900)
          Text(this.language === 'en' && product.englishDescription ? product.englishDescription : product.description)
            .fontColor(Theme.muted).fontSize(14).lineHeight(24)
          Text(this.t('size')).fontColor(Theme.cyan).fontSize(11).fontWeight(900)
          Flex({ wrap: FlexWrap.Wrap }) {
            ForEach(product.sizes.length > 0 ? product.sizes : ['均码'], (label: string) => {
              SiteButton({ label: label === '均码' ? this.t('oneSize') : label,
                kind: this.selectedSize === label ? 'primary' : 'secondary', buttonHeight: 44,
                onAction: () => { this.selectedSize = label; this.noticeKey = ''; } })
                .width(label === '均码' ? 106 : 58).margin({ right: 8, bottom: 8 })
            }, (label: string) => label)
          }.width('100%')
          Row({ space: 16 }) {
            Text(this.t('quantity')).fontColor(Theme.muted).fontSize(12).layoutWeight(1)
            SiteButton({ label: '−', kind: 'secondary', buttonHeight: 44, available: this.quantity > 1,
              onAction: () => { this.quantity--; } }).width(44)
            Text(this.quantity.toString()).fontColor(Theme.text)
            SiteButton({ label: '+', kind: 'secondary', buttonHeight: 44, available: this.quantity < product.stock,
              onAction: () => { this.quantity++; } }).width(44)
          }.width('100%')
          Text(product.price <= 0 ? this.t('detailsPending') :
            (product.stock > 0 ? this.t('stock') + ' / ' + product.stock : this.t('soldOut')))
            .fontColor(Theme.muted).fontSize(12)
        }.alignItems(HorizontalAlign.Start).padding({ left: 20, right: 20, bottom: 20 }).width('100%')
      }.width('100%')
    }.layoutWeight(1).scrollBar(BarState.Off).align(Alignment.Top)
  }

  build() {
    Column() {
      SiteButton({ label: this.t('back'), kind: 'secondary', buttonHeight: 44, onAction: this.onBack })
      if (this.store.findProduct(this.productId)) {
        this.detail(this.store.findProduct(this.productId)!)
        if (this.noticeKey.length > 0) { Text(this.t(this.noticeKey)).fontColor(Theme.cyan).fontSize(12).padding(10) }
        Row({ space: 12 }) {
          SiteButton({ label: this.t('addCart'), kind: 'secondary', available: this.store.findProduct(this.productId)!.stock > 0,
            onAction: () => { this.add(false); } }).layoutWeight(1)
          SiteButton({ label: this.t('buyNow'), available: this.store.findProduct(this.productId)!.stock > 0,
            onAction: () => { this.add(true); } }).layoutWeight(1)
        }.padding(16).width('100%').backgroundColor(Theme.surface).border({ width: { top: 1 }, color: Theme.line })
      } else {
        EmptyState({ titleKey: 'productMissing', bodyKey: 'productMissingBody', actionKey: 'back', onAction: this.onBack })
      }
    }.height('100%').width('100%').backgroundColor(Theme.background)
  }
}
