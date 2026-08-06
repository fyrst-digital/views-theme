<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Content\Breadcrumb\Struct\Breadcrumb as BreadcrumbStruct;
use Shopware\Core\Content\Breadcrumb\Struct\BreadcrumbCollection;
use Shopware\Core\Content\Category\CategoryDefinition;
use Shopware\Core\Content\Category\Service\CategoryBreadcrumbBuilder;
use Shopware\Core\Content\Seo\SeoUrlPlaceholderHandlerInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Breadcrumb — categoryId → core CategoryBreadcrumbBuilder → items.
 */
#[AsTwigComponent]
class Breadcrumb
{
    public ?string $categoryId = null;

    public string $separatorIcon = 'caret-right';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    /**
     * @var list<array{name: string, href: ?string, folder: bool, openInNewTab: bool, active: bool}>
     */
    public array $items = [];

    public function __construct(
        private readonly CategoryBreadcrumbBuilder $breadcrumbBuilder,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly SeoUrlPlaceholderHandlerInterface $seoUrlPlaceholderHandler,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $collection = $this->resolveCollection();
        if ($collection === null || $collection->count() === 0) {
            $this->visible = false;
            $this->items = [];

            return;
        }

        $this->items = $this->mapItems($collection);
        $this->visible = $this->items !== [];
    }

    private function resolveCollection(): ?BreadcrumbCollection
    {
        if (!\is_string($this->categoryId) || $this->categoryId === '') {
            return null;
        }

        $salesChannelContext = $this->salesChannelContextAccessor->get();
        if ($salesChannelContext === null) {
            return null;
        }

        $category = $this->breadcrumbBuilder->loadCategory(
            $this->categoryId,
            $salesChannelContext->getContext(),
        );

        if ($category === null) {
            return null;
        }

        return $this->breadcrumbBuilder->getCategoryBreadcrumbUrls(
            $category,
            $salesChannelContext->getContext(),
            $salesChannelContext->getSalesChannel(),
        );
    }

    /**
     * @return list<array{name: string, href: ?string, folder: bool, openInNewTab: bool, active: bool}>
     */
    private function mapItems(BreadcrumbCollection $collection): array
    {
        $crumbs = array_values($collection->getElements());
        $lastIndex = \count($crumbs) - 1;
        $items = [];

        foreach ($crumbs as $index => $crumb) {
            if (!$crumb instanceof BreadcrumbStruct) {
                continue;
            }

            $folder = $crumb->type === CategoryDefinition::TYPE_FOLDER;
            $active = $index === $lastIndex;
            $href = null;

            if (!$folder && !$active && $crumb->categoryId !== '') {
                $href = $this->seoUrlPlaceholderHandler->generate(
                    'frontend.navigation.page',
                    ['navigationId' => $crumb->categoryId],
                );
            }

            $items[] = [
                'name' => $crumb->name,
                'href' => $href,
                'folder' => $folder,
                'openInNewTab' => $crumb->shouldOpenInNewTab(),
                'active' => $active,
            ];
        }

        return $items;
    }
}
