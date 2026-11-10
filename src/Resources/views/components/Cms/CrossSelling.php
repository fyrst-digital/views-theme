<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Cms;

use Fyrst\ViewsTheme\Struct\CrossSellingTab;
use Shopware\Core\Content\Product\Aggregate\ProductCrossSelling\ProductCrossSellingEntity;
use Shopware\Core\Content\Product\SalesChannel\CrossSelling\CrossSellingElement;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Cms:CrossSelling — one tab + Product:Carousel per active cross-selling with products.
 */
#[AsTwigComponent]
class CrossSelling
{
    /**
     * `CrossSellingElementCollection` (CMS element data) or any iterable of `CrossSellingElement`.
     */
    public mixed $crossSellings = null;

    /**
     * `Product:Box` layout, passed to `Product:Carousel` (which normalises `standard` / empty).
     */
    public string $boxLayout = 'default';

    /**
     * Carousel item width, passed to `Product:Carousel` (which validates it).
     */
    public string|int|null $itemWidth = null;

    /**
     * Skip-link target (CMS block id). Renders a "Skip product gallery" link before the tabs
     * and the `content-after-target-{id}` anchor after them.
     */
    public ?string $skipTarget = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var list<CrossSellingTab>
     */
    public array $tabs = [];

    public ?string $activeTabId = null;

    /**
     * False when no active cross-selling has products: the template renders nothing,
     * so `Cms:Element` / `Cms:Block` drop the empty block.
     */
    public bool $visible = false;

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $this->tabs = $this->buildTabs($this->crossSellings);
        $this->activeTabId = $this->tabs[0]->tabId ?? null;
        $this->visible = $this->tabs !== [];
    }

    /**
     * @return list<CrossSellingTab>
     */
    private function buildTabs(mixed $crossSellings): array
    {
        if (!is_iterable($crossSellings)) {
            return [];
        }

        $tabs = [];
        foreach ($crossSellings as $element) {
            if (!$element instanceof CrossSellingElement || $element->getTotal() <= 0) {
                continue;
            }

            $crossSelling = $element->getCrossSelling();
            if (!$crossSelling->isActive()) {
                continue;
            }

            $id = $crossSelling->getId();
            $tabs[] = new CrossSellingTab(
                id: $id,
                name: $this->translatedName($crossSelling),
                products: $element->getProducts(),
                tabId: 'cross-selling-tab-' . $id,
                panelId: 'cross-selling-tab-' . $id . '-pane',
            );
        }

        return $tabs;
    }

    private function translatedName(ProductCrossSellingEntity $crossSelling): string
    {
        $translated = $crossSelling->getTranslation('name');
        if (\is_string($translated) && $translated !== '') {
            return $translated;
        }

        return (string) ($crossSelling->getName() ?? '');
    }
}
