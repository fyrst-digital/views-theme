<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address;

use Fyrst\ViewsTheme\Service\ComponentData;
use Fyrst\ViewsTheme\Service\FieldGrid;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:PersonalCompany — company / department / VAT field codes.
 */
#[AsTwigComponent]
class PersonalCompany
{
    public mixed $data = null;

    public string $prefix = '';

    public string $idPrefix = '';

    public bool $showVat = true;

    public mixed $vatValue = null;

    public mixed $formViolations = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * Company-grid slot order. A list replaces the default; unknown names are dropped.
     *
     * @var list<string>|null
     */
    public ?array $order = null;

    /**
     * Column spans (1–12) merged over the defaults (company, department, and vat are 3).
     *
     * @var array<string, int|string>
     */
    public array $spans = [];

    /**
     * @var array<string, array{id: string, name: string, value: mixed, violationPath: string, autocomplete?: string}>
     */
    public array $fields = [];

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $vatName = $this->prefix !== '' && $this->prefix !== 'billingAddress'
            ? $this->prefix . '[vatIds][]'
            : 'vatIds[]';

        $this->vatValue = ComponentData::scalar($this->vatValue) ?? $this->resolveVatValue();

        $this->fields = [
            'company' => ComponentData::field($this->idPrefix, $this->prefix, '-company', 'company', ComponentData::get($this->data, 'company'), true, 'section-personal organization'),
            'department' => ComponentData::field($this->idPrefix, $this->prefix, '-department', 'department', ComponentData::get($this->data, 'department'), true, 'organization'),
            'vat' => [
                'id' => $this->idPrefix . $this->prefix . '-vatIds',
                'name' => $vatName,
                'value' => $this->vatValue,
                'violationPath' => '/vatIds',
                'autocomplete' => 'off',
            ],
        ];
        $this->order = FieldGrid::order($this->order, self::defaultOrder());
        $this->spans = FieldGrid::spans($this->spans, self::defaultSpans());
    }

    /**
     * @return list<string>
     */
    private static function defaultOrder(): array
    {
        return ['company', 'department', 'vat'];
    }

    /**
     * @return array<string, int>
     */
    private static function defaultSpans(): array
    {
        return [
            'company' => 3,
            'department' => 3,
            'vat' => 3,
        ];
    }

    private function resolveVatValue(): ?string
    {
        $vat = ComponentData::get($this->data, 'vatIds');
        if (\is_array($vat)) {
            $vat = $vat[0] ?? null;
        }

        return ComponentData::scalar($vat);
    }
}
