<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Fyrst\ViewsTheme\Service\ThemeCssVariables;
use Shopware\Core\Framework\Adapter\Twig\TwigContextHelper;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class ThemeCssVariablesExtension extends AbstractExtension
{
    public function __construct(
        private readonly ThemeCssVariables $themeCssVariables,
    ) {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('views_theme_css_vars', $this->cssVars(...), ['needs_context' => true]),
        ];
    }

    /**
     * @param array<string, mixed> $context
     *
     * @return array<string, string|int>
     */
    public function cssVars(array $context): array
    {
        $salesChannelContext = TwigContextHelper::getSalesChannelContext($context);
        if (!$salesChannelContext instanceof SalesChannelContext) {
            return [];
        }

        return $this->themeCssVariables->resolve($salesChannelContext);
    }
}
