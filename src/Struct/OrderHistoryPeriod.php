<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

/**
 * Order history date filter. The backing value is the `period` query param (months back);
 * no param means "all".
 */
enum OrderHistoryPeriod: string
{
    case Month1 = '1';
    case Months3 = '3';
    case Months6 = '6';
    case Months12 = '12';

    public const QUERY_PARAM = 'period';

    public static function fromQuery(mixed $value): ?self
    {
        return \is_string($value) ? self::tryFrom($value) : null;
    }

    public function since(\DateTimeImmutable $now = new \DateTimeImmutable()): \DateTimeImmutable
    {
        return $now->modify('-' . $this->value . ' months');
    }
}
