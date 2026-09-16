import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';
import { SiteButton } from '../components/SiteButton';
import { StoreState } from '../model/StoreState';
import { Product } from '../model/Product';
import { NATPHeader } from '../components/NATPHeader';
import { CategoryBar } from '../components/CategoryBar';
import { ProductCard } from '../components/ProductCard';

@Component
export struct MerchPage {
  @StorageLink('natpLanguage') private language: string = 'zh';

  private t(key: string): string { return tr(this.language, key); }

  @ObjectLink store: StoreState;
  @State category: string = 'ALL';
  onOpen: (id: string) => void = () => {};
  private categories: string[] = ['ALL', 'CLOTHING', 'MUSIC', 'GEAR', 'ACCESSORIES', 'POSTERS', 'LIMITED'];
  private slots: number[] = [0, 1, 2, 3, 4, 5, 6, 7];

  private filtered(): Product[] {
    return this.store.products.filter((product: Product) =>
      this.category === 'ALL' || (this.category === 'LIMITED' ? product.isLimited : product.category === this.category));
  }

  build() {
    Column({ space: 12 }) {
      NATPHeader({ titleKey: 'allMerch', eyebrow: '01 / MERCH COLLECTION' })
      CategoryBar({ categories: this.categories, selected: this.category,
        onSelect: (value: string) => { this.category = value; } })
      if (this.filtered().length === 0) {
        Text(this.t('soon')).fontSize(12).fontColor(Theme.muted).padding({ left: 20, right: 20 })
      }
      Grid() {
        if (this.filtered().length > 0) {
          ForEach(this.filtered(), (product: Product) => {
            GridItem() {
              ProductCard({ product: product, favorite: this.store.favorites.includes(product.id),
                onOpen: this.onOpen, onFavorite: (id: string) => { this.store.toggleFavorite(id); } })
            }
          }, (product: Product) => product.id)
        } else {
          ForEach(this.slots, (slot: number) => {
            GridItem() { ProductCard() }
          }, (slot: number) => slot.toString())
        }
      }.columnsTemplate('1fr 1fr').columnsGap(12).rowsGap(12).scrollBar(BarState.Off)
        .layoutWeight(1).width('100%').padding({ left: 20, right: 20, bottom: 20 })
    }.width('100%').height('100%').backgroundColor(Theme.background)
  }
}
