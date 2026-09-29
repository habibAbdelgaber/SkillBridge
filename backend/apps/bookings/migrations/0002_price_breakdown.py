from decimal import Decimal

from django.db import migrations, models
from django.db.models import F


def preserve_existing_totals(apps, schema_editor):
    Booking = apps.get_model("bookings", "Booking")
    Booking.objects.using(schema_editor.connection.alias).update(service_fee=F("total_price"))


class Migration(migrations.Migration):
    dependencies = [("bookings", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="booking", name="service_fee",
            field=models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"), verbose_name="service fee"),
        ),
        migrations.AddField(
            model_name="booking", name="platform_fee",
            field=models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"), verbose_name="platform fee"),
        ),
        migrations.AddField(
            model_name="booking", name="vat_amount",
            field=models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"), verbose_name="VAT amount"),
        ),
        migrations.AddField(
            model_name="booking", name="currency",
            field=models.CharField(max_length=3, default="USD", verbose_name="currency"),
        ),
        migrations.RunPython(preserve_existing_totals, migrations.RunPython.noop),
    ]
