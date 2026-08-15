<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Form;

use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Form:Birthday — day / month / year option lists.
 */
#[AsTwigComponent]
class Birthday
{
    public ?string $id = null;

    public ?string $prefix = null;

    public mixed $label = null;

    public mixed $day = null;

    public mixed $month = null;

    public mixed $year = null;

    public mixed $validationRules = null;

    public mixed $formViolations = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $isRequired = false;

    public string $dayName = 'birthdayDay';

    public string $monthName = 'birthdayMonth';

    public string $yearName = 'birthdayYear';

    /**
     * @var list<array{value: int|string, label: int|string, disabled?: bool}>
     */
    public array $dayOptions = [];

    /**
     * @var list<array{value: int|string, label: int|string, disabled?: bool}>
     */
    public array $monthOptions = [];

    /**
     * @var list<array{value: int|string, label: int|string, disabled?: bool}>
     */
    public array $yearOptions = [];

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
        $this->id ??= 'vi-form-birthday-' . bin2hex(random_bytes(4));
        $this->label ??= $this->translator->trans('account.personalBirthdayLabel');
        $this->isRequired = \is_string($this->validationRules) && str_contains($this->validationRules, 'required');

        $this->dayName = $this->prefix ? $this->prefix . '[birthdayDay]' : 'birthdayDay';
        $this->monthName = $this->prefix ? $this->prefix . '[birthdayMonth]' : 'birthdayMonth';
        $this->yearName = $this->prefix ? $this->prefix . '[birthdayYear]' : 'birthdayYear';

        $this->dayOptions = $this->rangeOptions(1, 31, $this->translator->trans('account.personalBirthdaySelectDay'));
        $this->monthOptions = $this->rangeOptions(1, 12, $this->translator->trans('account.personalBirthdaySelectMonth'));

        $currentYear = (int) (new \DateTimeImmutable())->format('Y');
        $this->yearOptions = $this->rangeOptions($currentYear, $currentYear - 120, $this->translator->trans('account.personalBirthdaySelectYear'));
    }

    /**
     * @return list<array{value: int|string, label: int|string, disabled?: bool}>
     */
    private function rangeOptions(int $from, int $to, string $placeholder): array
    {
        $options = [[
            'value' => '',
            'label' => $placeholder,
            'disabled' => $this->isRequired,
        ]];

        $step = $from <= $to ? 1 : -1;
        for ($n = $from; $step > 0 ? $n <= $to : $n >= $to; $n += $step) {
            $options[] = ['value' => $n, 'label' => $n];
        }

        return $options;
    }
}
