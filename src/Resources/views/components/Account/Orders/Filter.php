<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Account\Orders;

use Fyrst\ViewsTheme\Struct\OrderHistoryPeriod;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Account:Orders:Filter — Form:Select options for order status and date range.
 * The "all" option value is {@see self::ALL}; the server ignores it like any unknown value.
 */
#[AsTwigComponent]
class Filter
{
    public const ALL = 'all';

    /**
     * Order states as `{ technicalName, name }` (page extension `viewsTheme.orderFilter.states`).
     *
     * @var iterable<array{technicalName: string, name: string}>
     */
    public iterable $states = [];

    public ?string $status = null;

    public ?string $period = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var list<array{value: string, label: string}>
     */
    public array $statusOptions = [];

    /**
     * @var list<array{value: string, label: string}>
     */
    public array $periodOptions = [];

    public bool $active = false;

    public function __construct(
        private readonly TranslatorInterface $translator,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $this->status ??= self::ALL;
        $this->period ??= self::ALL;
        $this->active = $this->status !== self::ALL || $this->period !== self::ALL;

        $this->statusOptions = [['value' => self::ALL, 'label' => $this->translator->trans('viewsTheme.account.ordersFilterStatusAll')]];
        foreach ($this->states as $state) {
            $this->statusOptions[] = ['value' => $state['technicalName'], 'label' => $state['name']];
        }

        $this->periodOptions = [['value' => self::ALL, 'label' => $this->translator->trans('viewsTheme.account.ordersFilterPeriodAll')]];
        foreach (OrderHistoryPeriod::cases() as $period) {
            $this->periodOptions[] = [
                'value' => $period->value,
                'label' => $this->translator->trans('viewsTheme.account.ordersFilterPeriod' . $period->value),
            ];
        }
    }
}
