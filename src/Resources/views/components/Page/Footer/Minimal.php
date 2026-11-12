<?php

declare(strict_types=1);

namespace Webflare\ViewsTheme\Resources\views\components\Page\Footer;

use Webflare\ViewsTheme\Service\FooterCmsUrlResolver;
use Shopware\Storefront\Pagelet\Footer\FooterPagelet;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Page:Footer:Minimal — shipping URL for the VAT notice; Twig only composes.
 */
#[AsTwigComponent]
class Minimal
{
    public mixed $footer = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public string $shippingUrl = '#';

    public string $brand = '<a href="https://webflare.sh" target="_blank" rel="noopener noreferrer" class="link-underline link-offset-1 link-underline-opacity-50 text-body-tertiary fw-semibold">Webflare</a>';

    public function __construct(
        private readonly FooterCmsUrlResolver $footerCmsUrlResolver,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->footer instanceof FooterPagelet) {
            return;
        }

        $urls = $this->footerCmsUrlResolver->urls($this->footer);
        $this->shippingUrl = $urls['shippingUrl'];
    }
}
