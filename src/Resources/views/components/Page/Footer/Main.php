<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Page\Footer;

use Fyrst\ViewsTheme\Service\FooterCmsUrlResolver;
use Shopware\Storefront\Pagelet\Footer\FooterPagelet;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Page:Footer:Main — CMS URLs from the footer pagelet; Twig only composes.
 */
#[AsTwigComponent]
class Main
{
    public mixed $footer = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public string $contactUrl = '#';

    public string $revocationUrl = '#';

    public string $shippingUrl = '#';

    public bool $showRevocation = false;

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
        $this->contactUrl = $urls['contactUrl'];
        $this->revocationUrl = $urls['revocationUrl'];
        $this->shippingUrl = $urls['shippingUrl'];
        $this->showRevocation = $urls['showRevocation'];
    }
}
