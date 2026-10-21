<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address\Input;

use Fyrst\ViewsTheme\Service\ComponentData;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Input:Birthday — day, month, and year passed to Form:Birthday.
 */
#[AsTwigComponent]
class Birthday
{
    public mixed $data = null;

    public mixed $formViolations = null;

    public string $prefix = '';

    public string $idPrefix = '';

    public ?bool $showBirthdayField = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $visible = false;

    public bool $required = false;

    public ?string $validationRules = null;

    public string $id = '';

    public mixed $day = null;

    public mixed $month = null;

    public mixed $year = null;

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();
        $this->formViolations = ComponentData::formViolations(
            $this->formViolations,
            $this->requestStack->getCurrentRequest(),
        );
        $this->visible = $this->showBirthdayField ?? (bool) $this->systemConfigService->get('core.loginRegistration.showBirthdayField', $salesChannelId);
        $this->required = (bool) $this->systemConfigService->get('core.loginRegistration.birthdayFieldRequired', $salesChannelId);
        $this->validationRules = $this->required ? 'required' : null;
        $this->id = $this->idPrefix . $this->prefix . 'personalBirthday';

        $birthday = $this->resolveBirthday();
        $this->day = $birthday['day'];
        $this->month = $birthday['month'];
        $this->year = $birthday['year'];
    }

    /**
     * @return array{day: int|string|null, month: int|string|null, year: int|string|null}
     */
    private function resolveBirthday(): array
    {
        $day = ComponentData::get($this->data, 'birthdayDay');
        $month = ComponentData::get($this->data, 'birthdayMonth');
        $year = ComponentData::get($this->data, 'birthdayYear');
        if ($day !== null || $month !== null || $year !== null) {
            return ['day' => $day, 'month' => $month, 'year' => $year];
        }

        $birthday = ComponentData::get($this->data, 'birthday');
        if ($birthday instanceof \DateTimeInterface) {
            return [
                'day' => (int) $birthday->format('d'),
                'month' => (int) $birthday->format('m'),
                'year' => (int) $birthday->format('Y'),
            ];
        }

        return ['day' => null, 'month' => null, 'year' => null];
    }
}
