<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Fyrst\ViewsTheme\Service\ThemeCssVariables;
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
        $salesChannelContext = $this->salesChannelContext($context);
        if (!$salesChannelContext instanceof SalesChannelContext) {
            return [];
        }

        return $this->themeCssVariables->resolve($salesChannelContext);
    }

    /**
     * Same resolution as Shopware\Core\Framework\Adapter\Twig\TwigContextHelper,
     * which does not exist before 6.7.12. Storefront passes `context`; mail
     * rendering from 6.7.12 also passes `salesChannelContext`.
     *
     * @param array<string, mixed> $context
     */
    private function salesChannelContext(array $context): ?SalesChannelContext
    {
        $candidate = $context['context'] ?? null;
        if ($candidate instanceof SalesChannelContext) {
            return $candidate;
        }

        $candidate = $context['salesChannelContext'] ?? null;
        if ($candidate instanceof SalesChannelContext) {
            return $candidate;
        }

        return null;
    }
}
