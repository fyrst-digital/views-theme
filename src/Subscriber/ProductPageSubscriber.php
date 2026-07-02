<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Subscriber;

use Fyrst\ViewsTheme\Service\VariantsLoader;
use Fyrst\ViewsTheme\Struct\VariantsGridPagination;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Core\Framework\Struct\ArrayStruct;
use Shopware\Storefront\Page\Product\ProductPageLoadedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RequestStack;

class ProductPageSubscriber implements EventSubscriberInterface
{
    private const CONFIG_VARIANTS_GRID_ACTIVE = 'ViewsTheme.config.variantsGrid.active';
    private const CONFIG_ROWS_PER_PAGE = 'ViewsTheme.config.variantsGrid.rowsPerPage';
    private const PAGE_PARAMETER = 'variantsPage';

    public function __construct(
        private readonly VariantsLoader $variantsLoader,
        private readonly SystemConfigService $systemConfig,
        private readonly RequestStack $requestStack,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            ProductPageLoadedEvent::class => 'onProductPageLoaded',
        ];
    }

    public function onProductPageLoaded(ProductPageLoadedEvent $event): void
    {
        $page = $event->getPage();
        $product = $page->getProduct();
        $salesChannelContext = $event->getSalesChannelContext();

        $active = (bool) $this->systemConfig->get(
            self::CONFIG_VARIANTS_GRID_ACTIVE,
            $salesChannelContext->getSalesChannelId(),
        );

        if (!$active) {
            return;
        }

        $parentId = $product->getParentId() ?? $product->getId();
        $hasVariants = $product->getChildCount() > 0 || $product->getParentId() !== null;

        if (!$hasVariants) {
            return;
        }

        $limit = (int) $this->systemConfig->get(
            self::CONFIG_ROWS_PER_PAGE,
            $salesChannelContext->getSalesChannelId(),
        );

        if ($limit < 1) {
            $limit = 10;
        }

        $currentPage = $this->getCurrentPage();
        $total = $this->variantsLoader->countVariantsByParentId($parentId, $salesChannelContext);

        if ($total === 0) {
            return;
        }

        $totalPages = (int) ceil($total / $limit);

        if ($currentPage > $totalPages) {
            $currentPage = $totalPages;
        }

        if ($currentPage < 1) {
            $currentPage = 1;
        }

        $offset = ($currentPage - 1) * $limit;
        $pagedVariants = $this->variantsLoader->loadVariantsPageByParentId($parentId, $offset, $limit, $salesChannelContext);
        $groups = $this->variantsLoader->extractConfiguratorGroups($pagedVariants);

        $viewsTheme = $page->getExtension('viewsTheme');
        if (!$viewsTheme instanceof ArrayStruct) {
            $viewsTheme = new ArrayStruct();
            $page->addExtension('viewsTheme', $viewsTheme);
        }

        $viewsTheme->set('variantsGrid', new ArrayStruct([
            'variants' => $pagedVariants,
            'groups' => $groups,
            'pagination' => new VariantsGridPagination($currentPage, $limit, $total),
            'parentId' => $parentId,
            'pageParameter' => self::PAGE_PARAMETER,
        ]));
    }

    private function getCurrentPage(): int
    {
        $request = $this->requestStack->getCurrentRequest();

        if ($request === null) {
            return 1;
        }

        $page = $request->query->getInt(self::PAGE_PARAMETER, 1);

        return $page < 1 ? 1 : $page;
    }
}
