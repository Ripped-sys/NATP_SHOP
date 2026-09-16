import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';
import { SiteButton } from '../components/SiteButton';
import { StoreState } from '../model/StoreState';
import { ProductCard } from '../components/ProductCard';
import { CategoryBar } from '../components/CategoryBar';

@Component
export struct HomePage {
  @StorageLink('natpLanguage') private language: string = 'zh';

  private t(key: string): string { return tr(this.language, key); }

  @ObjectLink store: StoreState;
  displayName: string = '';
  onOpen: (id: string) => void = () => {};
  onShop: (category: string) => void = () => {};
  @State private showAbout: boolean = false;
  private pageScroller: Scroller = new Scroller();
  private categories: string[] = ['CLOTHING', 'MUSIC', 'GEAR', 'ACCESSORIES', 'POSTERS'];

  private productRows(): number[] {
    const rows: number[] = [];
    const count: number = this.store.products.length > 0 ? this.store.products.length : 8;
    for (let i: number = 0; i < count; i += 2) { rows.push(i / 2); }
    return rows;
  }

  build() {
    List({ scroller: this.pageScroller, space: 28 }) {
      ListItem() {
        Stack({ alignContent: Alignment.BottomStart }) {
          Image($r('app.media.natp_live_wide')).width('100%').height('100%').objectFit(ImageFit.Cover)
          Column().width('100%').height('100%')
            .linearGradient({ angle: 180, colors: [['#1805060A', 0], ['#E805060A', 1]] })
          Column({ space: 12 }) {
            Text('NATP / OFFICIAL STORE · XI’AN').fontSize(10).fontWeight(900).letterSpacing(1).fontColor(Theme.cyan)
            Text('NATP').fontSize(68).fontWeight(900).fontColor(Theme.text)
            Text(this.t('band')).fontSize(this.language === 'en' ? 14 : 27).fontWeight(700).fontColor('#CCDCE5')
            Text(this.t('slogan')).fontSize(this.language === 'en' ? 36 : 38).fontWeight(900)
              .fontColor(Theme.text).lineHeight(this.language === 'en' ? 39 : 46)
            Text(this.t('newDropIntro')).fontSize(14).fontColor(Theme.muted).margin({ bottom: 8 })
            Row({ space: 12 }) {
              SiteButton({ label: this.t('shopNow'), onAction: () => { this.onShop('ALL'); } }).layoutWeight(1)
              SiteButton({ label: this.t('stageLink'), kind: 'secondary',
                onAction: () => { this.pageScroller.scrollToIndex(3); } }).layoutWeight(1)
            }.width('100%')
          }.width('100%').alignItems(HorizontalAlign.Start).padding(22)
        }.width('100%').height(470)
      }
      ListItem() {
        CategoryBar({ categories: this.categories, selected: '', onSelect: this.onShop })
      }
      ListItem() {
        Column({ space: 16 }) {
          Text('01 / MERCH COLLECTION').fontSize(10).fontWeight(900).letterSpacing(1.5).fontColor(Theme.cyan)
          Text(this.t('newDrop')).fontSize(32).fontWeight(900).fontColor(Theme.text)
          if (this.store.products.length === 0) {
            Text(this.t('soon')).fontSize(12).fontColor(Theme.muted)
          }
          ForEach(this.productRows(), (row: number) => {
            Row({ space: 12 }) {
              ProductCard({ product: this.store.products[row * 2],
                favorite: this.store.products[row * 2] ? this.store.favorites.includes(this.store.products[row * 2].id) : false,
                onOpen: this.onOpen, onFavorite: (id: string) => { this.store.toggleFavorite(id); } }).layoutWeight(1)
              if (this.store.products.length === 0 || row * 2 + 1 < this.store.products.length) {
                ProductCard({ product: this.store.products[row * 2 + 1],
                  favorite: this.store.products[row * 2 + 1] ? this.store.favorites.includes(this.store.products[row * 2 + 1].id) : false,
                  onOpen: this.onOpen, onFavorite: (id: string) => { this.store.toggleFavorite(id); } }).layoutWeight(1)
              } else {
                Blank().layoutWeight(1)
              }
            }.width('100%')
          }, (row: number) => row.toString())
        }.width('100%').alignItems(HorizontalAlign.Start).padding({ left: 20, right: 20 })
      }
      ListItem() {
        Column({ space: 18 }) {
          Text('02 / FROM THE STAGE').fontSize(10).fontWeight(900).letterSpacing(1.5).fontColor(Theme.cyan)
          Text(this.t('stage')).fontSize(30).fontWeight(900).fontColor(Theme.text)
          Image($r('app.media.natp_live_portrait')).width('100%').height(360)
            .objectFit(ImageFit.Cover).border({ width: 1, color: Theme.line })
          Text(this.t('manifesto')).fontSize(24).fontWeight(900).fontColor(Theme.text).lineHeight(32)
          Text(this.t('manifestoBody')).fontSize(14).fontColor(Theme.muted).lineHeight(24)
          SiteButton({ label: this.t(this.showAbout ? 'collapse' : 'aboutButton'), kind: 'secondary',
            onAction: () => { this.showAbout = !this.showAbout; } })
          if (this.showAbout) {
            Text(this.t('aboutBody')).fontSize(14).fontColor(Theme.muted).lineHeight(24)
          }
          Text('NATP / XI’AN, CHINA').fontSize(11).letterSpacing(1.5).fontColor(Theme.dim).margin({ top: 10 })
        }.width('100%').alignItems(HorizontalAlign.Start).padding(20)
          .backgroundColor(Theme.surface).border({ width: { top: 1 }, color: Theme.line })
      }
    }.width('100%').height('100%').backgroundColor(Theme.background).scrollBar(BarState.Off)
  }
}
