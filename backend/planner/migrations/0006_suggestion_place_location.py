from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('planner', '0005_suggestion_trip_remove_coordinates'),
    ]

    operations = [
        migrations.AddField(
            model_name='suggestion',
            name='place_id',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='suggestion',
            name='lat',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='suggestion',
            name='lng',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
