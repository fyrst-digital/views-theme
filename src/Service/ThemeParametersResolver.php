<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\SalesChannelRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Theme\StorefrontPluginRegistry;
use Shopware\Storefront\Theme\ThemeCollection;
use Symfony\Component\HttpFoundation\Request;

class ThemeParametersResolver
{
    /**
     * @param EntityRepository<ThemeCollection> $themeRepository
     */
    public function __construct(
        private readonly StorefrontPluginRegistry $pluginRegistry,
        private readonly EntityRepository $themeRepository,
    ) {
    }

    /**
     * Resolves the active theme's configuration (theme.json) for the given request.
     *
     * @return array<string, mixed>|null The theme config array, or null if no theme is active or resolution fails.
     */
    public function resolve(Request $request, SalesChannelContext $context): ?array
    {
        $themeId = $request->attributes->get(SalesChannelRequest::ATTRIBUTE_THEME_ID);

        if (!$themeId) {
            return null;
        }

        $technicalName = $this->resolveTechnicalName((string) $themeId, $context->getContext());

        if (!$technicalName) {
            return null;
        }

        $pluginConfig = $this->pluginRegistry->getByTechnicalName($technicalName);

        if (!$pluginConfig) {
            return null;
        }

        return $pluginConfig->getThemeJson() ?? [];
    }

    private function resolveTechnicalName(string $themeId, Context $context): ?string
    {
        $criteria = new \Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria([$themeId]);
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
            $parentCriteria = new \Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria([$parentThemeId]);
            $parentCriteria->setTitle('views-theme::resolve-parent-technical-name');

            $parentTheme = $this->themeRepository->search($parentCriteria, $context)->getEntities()->get($parentThemeId);

            if ($parentTheme) {
                return $parentTheme->getTechnicalName();
            }
        }

        return null;
    }
}
