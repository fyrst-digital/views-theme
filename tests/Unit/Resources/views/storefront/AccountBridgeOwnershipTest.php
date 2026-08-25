<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\storefront;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class AccountBridgeOwnershipTest extends TestCase
{
    /**
     * @return iterable<string, array{0: string}>
     */
    public static function accountBridgeProvider(): iterable
    {
        $root = dirname(__DIR__, 5) . '/src/Resources/views/storefront';
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root . '/page/account', \FilesystemIterator::SKIP_DOTS),
        );
        foreach ($files as $file) {
            if ($file->isFile() && str_ends_with($file->getFilename(), '.html.twig')) {
                $relative = substr($file->getPathname(), strlen($root) + 1);
                yield $relative => [$file->getPathname()];
            }
        }

        $componentDir = $root . '/component/account';
        foreach (glob($componentDir . '/*.html.twig') ?: [] as $path) {
            $relative = substr($path, strlen($root) + 1);
            yield $relative => [$path];
        }
    }

    #[DataProvider('accountBridgeProvider')]
    public function testAccountBridgeOnlyMountsThemeTags(string $path): void
    {
        $source = (string) file_get_contents($path);

        self::assertStringContainsString("{% sw_extends '@Storefront/", $source);
        self::assertMatchesRegularExpression('/<twig:ViewsTheme:[A-Za-z:]+/', $source);
        self::assertDoesNotMatchRegularExpression('/data-form-(handler|auto-submit|ajax-submit)/', $source);
        self::assertStringNotContainsString('data-order-detail-loader', $source);
        self::assertStringNotContainsString('data-address-manager', $source);
        self::assertStringNotContainsString('account-aside', $source);
        self::assertStringNotContainsString('js-form-field-toggle-guest-mode', $source);
    }
}
