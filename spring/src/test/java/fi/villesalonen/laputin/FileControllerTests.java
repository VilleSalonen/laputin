package fi.villesalonen.laputin;

import fi.villesalonen.laputin.entities.FileEntity;
import fi.villesalonen.laputin.entities.TagEntity;
import fi.villesalonen.laputin.records.FileRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit4.SpringRunner;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.HashMap;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
public class FileControllerTests {
    @Value("${local.server.port}")
    private int randomServerPort;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    FileRepository fileRepository;
    @Autowired
    TagRepository tagRepository;

    @SuppressWarnings("resource")
    @Container
    public static PostgreSQLContainer<?> postgreSQLContainer = new PostgreSQLContainer<>("postgres:15.3")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgreSQLContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgreSQLContainer::getUsername);
        registry.add("spring.datasource.password", postgreSQLContainer::getPassword);
    }

    @BeforeEach
    public void before() {
        fileRepository.deleteAll();
        tagRepository.deleteAll();
    }

    @Nested
    class QueryByHash {
        @BeforeEach
        public void beforeEach() {
            // Arrange
            TagEntity tag1 = new TagEntity();
            tag1.setName("First");
            tagRepository.save(tag1);

            FileEntity file1 = new FileEntity();
            file1.setHash("abc");
            file1.setPath("/path/to/file1");
            file1.setActive(1);
            file1.setSize(12381231);
            file1.setMetadata(new HashMap<>());
            file1.setType("image/jpeg");
            file1.setTags(Set.of(tag1));
            fileRepository.save(file1);

            FileEntity file2 = new FileEntity();
            file2.setHash("def");
            file2.setPath("/path/to/file2");
            file2.setActive(1);
            file2.setSize(431741);
            file2.setMetadata(new HashMap<>());
            file2.setType("image/jpeg");
            fileRepository.save(file2);

            FileEntity file3 = new FileEntity();
            file3.setHash("ghi");
            file3.setPath("/path/to/file3");
            file3.setActive(1);
            file3.setSize(7571);
            file3.setMetadata(new HashMap<>());
            file3.setType("image/jpeg");
            fileRepository.save(file3);
        }

        @Test
        public void whenQueryingByHash_givenFilesExist_thenReturnsOnlyMatchingFiles() {
            // Act
            ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
                "http://localhost:" + randomServerPort + "/files?hash=abc&hash=ghi",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            // Assert
            List<FileRecord> returnedFiles = response.getBody();
            assertThat(returnedFiles)
                .extracting(FileRecord::path)
                .containsExactlyInAnyOrder("/path/to/file1", "/path/to/file3");
        }
    }

    @Nested
    class QueryByActive {
        @BeforeEach
        public void beforeEach() {
            // Arrange
            TagEntity tag1 = new TagEntity();
            tag1.setName("First");
            tagRepository.save(tag1);

            FileEntity file1 = new FileEntity();
            file1.setHash("abc");
            file1.setPath("/path/to/file1");
            file1.setActive(1);
            file1.setSize(12381231);
            file1.setMetadata(new HashMap<>());
            file1.setType("image/jpeg");
            file1.setTags(Set.of(tag1));
            fileRepository.save(file1);

            FileEntity file2 = new FileEntity();
            file2.setHash("def");
            file2.setPath("/path/to/file2");
            file2.setActive(1);
            file2.setSize(431741);
            file2.setMetadata(new HashMap<>());
            file2.setType("image/jpeg");
            fileRepository.save(file2);

            FileEntity file3 = new FileEntity();
            file3.setHash("ghi");
            file3.setPath("/path/to/file3");
            file3.setActive(0);
            file3.setSize(7571);
            file3.setMetadata(new HashMap<>());
            file3.setType("image/jpeg");
            fileRepository.save(file3);
        }

        @Test
        public void whenQueryingByHash_givenFilesExist_thenReturnsOnlyMatchingFiles() {
            // Act
            ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
                "http://localhost:" + randomServerPort + "/files",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            // Assert
            List<FileRecord> returnedFiles = response.getBody();
            assertThat(returnedFiles)
                .extracting(FileRecord::path)
                .containsExactlyInAnyOrder("/path/to/file1", "/path/to/file2");
        }

        @Test
        public void whenIncludeInactiveIsMissing_givenFilesExist_thenReturnsOnlyActiveFiles() {
            // Act
            ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
                "http://localhost:" + randomServerPort + "/files",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            // Assert
            List<FileRecord> returnedFiles = response.getBody();
            assertThat(returnedFiles)
                .extracting(FileRecord::path)
                .containsExactlyInAnyOrder("/path/to/file1", "/path/to/file2");
        }

        @Test
        public void whenIncludeInactiveFalse_givenFilesExist_thenReturnsOnlyActiveFiles() {
            // Act
            ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
                "http://localhost:" + randomServerPort + "/files?includeInactive=false",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            // Assert
            List<FileRecord> returnedFiles = response.getBody();
            assertThat(returnedFiles)
                .extracting(FileRecord::path)
                .containsExactlyInAnyOrder("/path/to/file1", "/path/to/file2");
        }

        @Test
        public void whenIncludeInactiveTrue_givenFilesExist_thenReturnsAllFiles() {
            // Act
            ResponseEntity<List<FileRecord>> response = restTemplate.exchange(
                "http://localhost:" + randomServerPort + "/files?includeInactive=true",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            // Assert
            List<FileRecord> returnedFiles = response.getBody();
            assertThat(returnedFiles)
                .extracting(FileRecord::path)
                .containsExactlyInAnyOrder("/path/to/file1", "/path/to/file2", "/path/to/file3");
        }
    }
}
