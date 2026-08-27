<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Content\Category\CategoryCollection;
use Shopware\Core\Content\Category\CategoryEntity;
use Shopware\Core\Content\Category\SalesChannel\SalesChannelCategoryEntity;
use Shopware\Core\Content\Category\Tree\TreeItem;
use Shopware\Core\Content\Seo\SeoUrlPlaceholderHandlerInterface;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Pagelet\Footer\FooterPagelet;

/**
 * Resolves CMS-page URLs for footer chrome (contact, revocation, shipping/VAT).
 *
 * Prefers a matching category `seoUrl` from the service menu or footer nav tree,
 * then falls back to `frontend.cms.page.full`.
 */
final class FooterCmsUrlResolver
{
    public function __construct(
        private readonly SeoUrlPlaceholderHandlerInterface $seoUrls,
        private readonly SystemConfigService $systemConfig,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
    ) {
    }

    /**
     * @return array{contactUrl: string, revocationUrl: string, shippingUrl: string, showRevocation: bool}
     */
    public function urls(FooterPagelet $footer): array
    {
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();
        $contactId = $this->configId('core.basicInformation.contactPage', $salesChannelId);
        $revocationId = $this->configId('core.basicInformation.revocationRequestPage', $salesChannelId);
        $shippingId = $this->configId('core.basicInformation.shippingPaymentInfoPage', $salesChannelId);

        return [
            'contactUrl' => $this->resolve($contactId, $footer),
            'revocationUrl' => $this->resolve($revocationId, $footer),
            'shippingUrl' => $this->resolve($shippingId, $footer),
            'showRevocation' => $revocationId !== null
                && $this->systemConfig->getBool('core.basicInformation.showRevocationButton', $salesChannelId),
        ];
    }

    public function resolve(?string $cmsPageId, FooterPagelet $footer): string
    {
        if ($cmsPageId === null || $cmsPageId === '') {
            return '#';
        }

        $fromMenu = $this->fromCategories($cmsPageId, $footer->getServiceMenu());
        if ($fromMenu !== null) {
            return $fromMenu;
        }

        $fromTree = $this->fromTree($cmsPageId, $footer->getNavigation()?->getTree() ?? []);
        if ($fromTree !== null) {
            return $fromTree;
        }

        return $this->seoUrls->generate('frontend.cms.page.full', ['id' => $cmsPageId]);
    }

    private function configId(string $key, ?string $salesChannelId): ?string
    {
        $value = $this->systemConfig->getString($key, $salesChannelId);

        return $value !== '' ? $value : null;
    }

    private function fromCategories(string $cmsPageId, CategoryCollection $categories): ?string
    {
        foreach ($categories as $category) {
            $url = $this->fromCategory($cmsPageId, $category);
            if ($url !== null) {
                return $url;
            }
        }

        return null;
    }

    /**
     * @param list<TreeItem> $items
     */
    private function fromTree(string $cmsPageId, array $items): ?string
    {
        foreach ($items as $item) {
            $url = $this->fromCategory($cmsPageId, $item->getCategory());
            if ($url !== null) {
                return $url;
            }

            $nested = $this->fromTree($cmsPageId, $item->getChildren());
            if ($nested !== null) {
                return $nested;
            }
        }

        return null;
    }

    private function fromCategory(string $cmsPageId, CategoryEntity $category): ?string
    {
        if ($category->getCmsPageId() !== $cmsPageId) {
            return null;
        }

        if (!$category instanceof SalesChannelCategoryEntity) {
            return null;
        }

        $seoUrl = $category->getSeoUrl();

        return \is_string($seoUrl) && $seoUrl !== '' ? $seoUrl : null;
    }
}
