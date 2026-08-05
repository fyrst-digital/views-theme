<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Currency;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Currency:Action — derivation lives here; Twig only composes.
 */
#[AsTwigComponent]
class Action
{
    public mixed $currencies = [];

    public ?string $activeCurrencyId = null;

    public ?string $id = null;

    public bool $showSymbol = true;

    public string $placement = 'bottom-end';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    public string $ariaName = '';

    public string $currencySymbol = '';

    public function __construct(
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $context = $this->salesChannelContextAccessor->get();
        $currency = $context?->getCurrency();

        $this->currencies ??= [];
        $this->activeCurrencyId ??= $currency?->getId();
        $this->id ??= 'vi-currency-action-' . bin2hex(random_bytes(4));

        $this->currencySymbol = $currency?->getSymbol() ?? '';
        $currencyName = '';
        if ($currency !== null) {
            $translated = $currency->getTranslation('name');
            $currencyName = \is_string($translated) && $translated !== ''
                ? $translated
                : (string) ($currency->getName() ?? '');
        }
        $this->ariaName = $currencyName;

        $this->visible = $this->countItems($this->currencies) > 1;
    }


    private function countItems(mixed $items): int
    {
        if ($items instanceof EntityCollection) {
            return $items->count();
        }

        if (\is_countable($items)) {
            return \count($items);
        }

        return 0;
    }
}
