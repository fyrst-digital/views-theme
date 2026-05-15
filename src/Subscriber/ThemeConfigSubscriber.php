<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Subscriber;

use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\SalesChannelRequest;
use Shopware\Storefront\Event\StorefrontRenderEvent;
use Shopware\Storefront\Page\Page;
use Shopware\Storefront\Pagelet\Pagelet;
use Shopware\Storefront\Theme\StorefrontPluginRegistry;
use Shopware\Storefront\Theme\ThemeCollection;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class ThemeConfigSubscriber implements EventSubscriberInterface
{
    /**
     * @param EntityRepository<ThemeCollection> $themeRepository
     */
    public function __construct(
        private readonly StorefrontPluginRegistry $pluginRegistry,
        private readonly EntityRepository $themeRepository,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            StorefrontRenderEvent::class => 'onStorefrontRender',
        ];
    }

    public function onStorefrontRender(StorefrontRenderEvent $event): void
    {
        $request = $event->getRequest();
        $themeId = $request->attributes->get(SalesChannelRequest::ATTRIBUTE_THEME_ID);

        if (!$themeId) {
            return;
        }

        $technicalName = $this->resolveTechnicalName((string) $themeId, $event->getSalesChannelContext()->getContext());

        if (!$technicalName) {
            return;
        }

        $pluginConfig = $this->pluginRegistry->getByTechnicalName($technicalName);

        if (!$pluginConfig) {
            return;
        }

        $themeJson = $pluginConfig->getThemeJson() ?? [];

        $event->setParameter('themeParameters', $themeJson);
    }

    private function resolveTechnicalName(string $themeId, \Shopware\Core\Framework\Context $context): ?string
    {
        $criteria = new Criteria([$themeId]);
        $criteria->setTitle('views-theme::resolve-technical-name');

        $theme = $this->themeRepository->search($criteria, $context)->getEntities()->get($themeId);

        if (!$theme) {
            return null;
        }

        if ($theme->getTechnicalName()) {
            return $theme->getTechnicalName();
        }

        // Database copy themes have no technical name; fall back to parent theme
        $parentThemeId = $theme->getParentThemeId();
        if ($parentThemeId) {
            $parentCriteria = new Criteria([$parentThemeId]);
            $parentCriteria->setTitle('views-theme::resolve-parent-technical-name');

            $parentTheme = $this->themeRepository->search($parentCriteria, $context)->getEntities()->get($parentThemeId);

            if ($parentTheme) {
                return $parentTheme->getTechnicalName();
            }
        }

        return null;
    }

    private function normalizeIcons(mixed $icons): array
    {
        if (\is_array($icons)) {
            return $icons;
        }

        if (\is_string($icons)) {
            $decoded = json_decode($icons, true);
            if (json_last_error() === JSON_ERROR_NONE && \is_array($decoded)) {
                return $decoded;
            }
        }

        return ['value' => $icons];
    }
}
